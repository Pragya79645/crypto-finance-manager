"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart } from "@/components/ui/chart"
import { Target, Wallet, Gift, TrendingUp } from "lucide-react"
import Link from "next/link"
import { deskreeClient } from "@/lib/deskree"
import { useToast } from "@/components/ui/use-toast"

type Goal = {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  category: string
  createdAt: string
}

type Transaction = {
  id: string
  amount: number
  type: "deposit" | "donation"
  goalId: string
  goalTitle: string
  timestamp: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch goals
        const goalsResponse = await deskreeClient.database.getAll("goals")
        const userGoals = goalsResponse.data.filter((goal: any) => goal.userId === user?.id)
        setGoals(userGoals)

        // Fetch transactions
        const transactionsResponse = await deskreeClient.database.getAll("transactions")
        const userTransactions = transactionsResponse.data.filter((transaction: any) => transaction.userId === user?.id)
        setTransactions(userTransactions)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          variant: "destructive",
          title: "Error loading dashboard",
          description: "Could not load your data. Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, toast])

  // Calculate total savings
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  // Prepare chart data
  const goalChartData = goals.map((goal) => ({
    name: goal.title,
    value: goal.currentAmount,
    target: goal.targetAmount,
  }))

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSaved} Tokens</div>
              <p className="text-xs text-muted-foreground">{Math.round(overallProgress)}% of your total goals</p>
              <Progress value={overallProgress} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals.length}</div>
              <p className="text-xs text-muted-foreground">
                {goals.filter((g) => g.currentAmount >= g.targetAmount).length} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Donations Received</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter((t) => t.type === "donation").reduce((sum, t) => sum + t.amount, 0)} XLM
              </div>
              <p className="text-xs text-muted-foreground">
                {transactions.filter((t) => t.type === "donation").length} donations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">From last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Savings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bar">
                <TabsList className="mb-4">
                  <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                  <TabsTrigger value="line">Line Chart</TabsTrigger>
                </TabsList>
                <TabsContent value="bar">
                  <BarChart
                    data={goalChartData}
                    index="name"
                    categories={["value", "target"]}
                    colors={["primary", "muted"]}
                    valueFormatter={(value) => `${value} Tokens`}
                    className="h-[300px]"
                  />
                </TabsContent>
                <TabsContent value="line">
                  <LineChart
                    data={[
                      { date: "Jan", amount: 100 },
                      { date: "Feb", amount: 250 },
                      { date: "Mar", amount: 300 },
                      { date: "Apr", amount: 400 },
                      { date: "May", amount: 500 },
                      { date: "Jun", amount: 650 },
                    ]}
                    index="date"
                    categories={["amount"]}
                    colors={["primary"]}
                    valueFormatter={(value) => `${value} Tokens`}
                    className="h-[300px]"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
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
                          {transaction.type === "deposit" ? "Deposit" : "Donation"} to {transaction.goalTitle}
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
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                )}
              </div>
              <div className="mt-4">
                <Link href="/transactions">
                  <Button variant="outline" className="w-full">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
