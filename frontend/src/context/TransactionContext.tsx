import * as React from "react";

import { contractAbi, contractAddress } from "../utils";

import { ethers } from "ethers";

declare var window: any;

interface ITransactionContextData {
  connectWallet: () => Promise<void>;
  connectedAccount: string;
  formData: {
    addressTo: string;
    amount: string;
    keyword: string;
    message: string;
  };
  setFormData: (data: {
    addressTo: string;
    amount: string;
    keyword: string;
    message: string;
  }) => void;
  sendTransaction: () => Promise<void>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>, name: string) => void;
  transactions: any[];
  loading: boolean;
}

export const TransactionContext = React.createContext<ITransactionContextData>(
  {} as ITransactionContextData
);

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractAbi,
    signer
  );
  return transactionContract;
};

export const TransactionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [connectedAccount, setConnectedAccount] = React.useState("");
  const [formData, setFormData] = React.useState<{
    addressTo: string;
    amount: string;
    keyword: string;
    message: string;
  }>({ addressTo: "", amount: "", keyword: "", message: "" });
  const [isLoading, setIsLoading] = React.useState(false);
  const [transactionCount, setTransactionCount] = React.useState(
    localStorage.getItem("transactionCount") || 0
  );
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const transactionContract = getEthereumContract();
      const avaliableTransactions =
        await transactionContract.getAllTransactions();
      const struccturedTransactions: any = avaliableTransactions.map(
        (transaction: {
          receiver: string;
          sender: string;
          timestamp: any;
          message: string;
          keyword: string;
          amount: any;
        }) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timestamp.toNumber() * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / 10 ** 18,
        })
      );
      setTransactions(struccturedTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setConnectedAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const checkIfTransactionsExists = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();

      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setConnectedAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            to: addressTo,
            gas: "0x5208", // 21000 Gwei
            value: parsedAmount._hex, // 0.0001 ETH
          },
        ],
      });

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      setIsLoading(true);
      console.log(`Loading transaction - ${transactionHash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Sucess - ${transactionHash}`);

      const transactionCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionCount.toNumber());
      window.reload();
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object.");
    }
  };

  React.useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExists();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formData,
        setFormData,
        sendTransaction,
        handleChange,
        transactions,
        loading: isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
