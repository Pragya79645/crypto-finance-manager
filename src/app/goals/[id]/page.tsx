"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LineChart } from "@/components/ui/chart"
import { Target, Wallet, Gift, ArrowLeft, SnowflakeIcon as Confetti } from "lucide-react"
import Link from "next/link"
import { deskreeClient } from "@/lib/deskree"
import { aptosClient } from "@/lib/aptos-client"
import { useToast } from "@/components/ui/use-toast"

type Goal = {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  category: string
  userId: string
  createdAt: string
}

type Transaction = {
  id: string
  amount: number
  type: "deposit" | "donation"
  goalId: string
  goalTitle: string
  userId: string
  timestamp: string
  txHash?: string
  sender?: string
}

export default function GoalDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState(0)
  const [walletAddress, setWalletAddress] = useState("")
  const [showCelebration, setShowCelebration] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchGoalData = async () => {
      try {
        // Fetch goal details
        const goalResponse = await deskreeClient.database.getById("goals", id as string)
        setGoal(goalResponse)

        // Fetch transactions for this goal
        const transactionsResponse = await deskreeClient.database.getAll("transactions")
        const goalTransactions = transactionsResponse.data.filter((transaction: any) => transaction.goalId === id)
        setTransactions(goalTransactions)

        // Check if wallet is connected
        const savedWallet = localStorage.getItem("aptos_wallet")
        if (savedWallet) {
          setWalletAddress(savedWallet)
        }
      } catch (error) {
        console.error("Error fetching goal data:", error)
        toast({
          variant: "destructive",
          title: "Error loading goal",
          description: "Could not load goal details. Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user && id) {
      fetchGoalData()
    }
  }, [user, id, toast])

  const handleConnectWallet = async () => {
    try {
      // In a real app, you would use a wallet adapter like Petra or Martian
      // For this demo, we'll create a new account
      const newAccount = aptosClient.createAccount()
      const address = newAccount.address().toString()

      // Fund the account with test tokens
      await aptosClient.fundAccount(newAccount)

      // Save the account (in a real app, you would use the wallet's methods)
      localStorage.setItem("aptos_wallet", address)
      localStorage.setItem("aptos_private_key", newAccount.toPrivateKeyObject().privateKeyHex)

      setWalletAddress(address)

      toast({
        title: "Wallet connected",
        description: `Test wallet created with address: ${address.slice(0, 6)}...${address.slice(-4)}`,
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
      toast({
        variant: "destructive",
        title: "Wallet connection failed",
        description: "Could not connect to Aptos wallet. Please try again.",
      })
    }
  }

  const handleDeposit = async () => {
    try {
      if (!goal || !user || !walletAddress || depositAmount <= 0) return

      // In a real app, you would use the wallet to sign and send the transaction
      // For this demo, we'll simulate it with our test account
      const privateKeyHex = localStorage.getItem("aptos_private_key")
      if (!privateKeyHex) {
        throw new Error("Private key not found")
      }

      const account = aptosClient.importAccount(privateKeyHex)

      // Simulate a transaction (in a real app, this would be a smart contract call)
      const txHash = await aptosClient.transferTokens(
        account,
        "0x1", // Placeholder recipient address
        depositAmount,
      )

      // Record the transaction in our database
      const transactionData = {
        amount: depositAmount,
        type: "deposit",
        goalId: goal.id,
        goalTitle: goal.title,
        userId: user.id,
        timestamp: new Date().toISOString(),
        txHash,
        sender: walletAddress,
      }

      const response = await deskreeClient.database.create("transactions", transactionData)

      // Update the goal's current amount
      const updatedGoal = {
        ...goal,
        currentAmount: goal.currentAmount + depositAmount,
      }

      await deskreeClient.database.update("goals", goal.id, {
        currentAmount: updatedGoal.currentAmount,
      })

      setGoal(updatedGoal)
      setTransactions([...transactions, { ...transactionData, id: response.id }])
      setDepositOpen(false)
      setDepositAmount(0)

      toast({
        title: "Deposit successful",
        description: `You've added ${depositAmount} tokens to your goal.`,
      })

      // Show celebration if goal is reached
      if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 5000)
      }
    } catch (error) {
      console.error("Error making deposit:", error)
      toast({
        variant: "destructive",
        title: "Deposit failed",
        description: "Could not complete your deposit. Please try again.",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardNav />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </main>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardNav />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Goal not found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The goal you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/goals">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Goals
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const progress = (goal.currentAmount / goal.targetAmount) * 100
  const isCompleted = goal.currentAmount >= goal.targetAmount

  // Prepare chart data
  const transactionHistory = transactions
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((acc: any[], transaction, index, array) => {
      const date = new Date(transaction.timestamp).toLocaleDateString()
      const previousTotal = index > 0 ? acc[index - 1].total : 0
      const total = previousTotal + transaction.amount

      return [...acc, { date, amount: transaction.amount, total }]
    }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Link href="/goals" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{goal.title}</h1>
          {isCompleted && (
            <div className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Completed</div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Progress</CardTitle>
              <CardDescription>{goal.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  {goal.currentAmount} / {goal.targetAmount} Tokens
                </span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 mb-4" />

              {!isCompleted ? (
                walletAddress ? (
                  <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Wallet className="mr-2 h-4 w-4" /> Make a Deposit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Deposit Tokens</DialogTitle>
                        <DialogDescription>Add tokens from your Aptos wallet to this savings goal.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Amount (Tokens)</Label>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(Number(e.target.value))}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Connected wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDepositOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleDeposit}>Deposit</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button className="w-full" onClick={handleConnectWallet}>
                    <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                  </Button>
                )
              ) : (
                <Button className="w-full" variant="outline" disabled>
                  <Confetti className="mr-2 h-4 w-4" /> Goal Completed!
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Donation Link</CardTitle>
              <CardDescription>Share this link to receive donations via Stellar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-2 rounded-md mb-4 text-sm font-mono overflow-hidden text-ellipsis">
                https://cryptosave.app/donate/{goal.id}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`https://cryptosave.app/donate/${goal.id}`)
                  toast({
                    title: "Link copied",
                    description: "Donation link copied to clipboard",
                  })
                }}
              >
                <Gift className="mr-2 h-4 w-4" /> Copy Donation Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Goal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="text-sm font-medium">
                    {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm font-medium">{new Date(goal.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transactions:</span>
                  <span className="text-sm font-medium">{transactions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Donations:</span>
                  <span className="text-sm font-medium">
                    {transactions.filter((t) => t.type === "donation").length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Progress History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionHistory.length > 0 ? (
                <LineChart
                  data={transactionHistory}
                  index="date"
                  categories={["total"]}
                  colors={["primary"]}
                  valueFormatter={(value) => `${value} Tokens`}
                  className="h-[300px]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <Target className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No transaction history yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center">
                        <div
                          className={`rounded-full p-2 ${transaction.type === "deposit" ? "bg-green-100" : "bg-blue-100"}`}
                        >
                          {transaction.type === "deposit" ? (
                            <Wallet className="h-4 w-4 text-green-600" />
                          ) : (
                            <Gift className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {transaction.type === "deposit" ? "Deposit" : "Donation"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          +{transaction.amount} {transaction.type === "deposit" ? "Tokens" : "XLM"}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="text-center">
              <Confetti className="h-24 w-24 text-primary animate-bounce" />
              <h2 className="text-3xl font-bold mt-4">Goal Completed!</h2>
              <p className="text-xl mt-2">Congratulations on reaching your savings goal!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
