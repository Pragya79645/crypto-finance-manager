"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Target, Trash } from "lucide-react"
import { deskreeClient } from "@/lib/deskree"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

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

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    targetAmount: 0,
    category: "education",
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await deskreeClient.database.getAll("goals")
        const userGoals = response.data.filter((goal: any) => goal.userId === user?.id)
        setGoals(userGoals)
      } catch (error) {
        console.error("Error fetching goals:", error)
        toast({
          variant: "destructive",
          title: "Error loading goals",
          description: "Could not load your goals. Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchGoals()
    }
  }, [user, toast])

  const handleCreateGoal = async () => {
    try {
      if (!user) return

      const goalData = {
        ...newGoal,
        currentAmount: 0,
        userId: user.id,
        createdAt: new Date().toISOString(),
      }

      const response = await deskreeClient.database.create("goals", goalData)

      setGoals([...goals, { ...goalData, id: response.id }])
      setNewGoal({
        title: "",
        description: "",
        targetAmount: 0,
        category: "education",
      })
      setOpen(false)

      toast({
        title: "Goal created",
        description: "Your new savings goal has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating goal:", error)
      toast({
        variant: "destructive",
        title: "Error creating goal",
        description: "Could not create your goal. Please try again.",
      })
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      await deskreeClient.database.delete("goals", id)
      setGoals(goals.filter((goal) => goal.id !== id))

      toast({
        title: "Goal deleted",
        description: "Your savings goal has been deleted.",
      })
    } catch (error) {
      console.error("Error deleting goal:", error)
      toast({
        variant: "destructive",
        title: "Error deleting goal",
        description: "Could not delete your goal. Please try again.",
      })
    }
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    education: "🎓",
    travel: "✈️",
    technology: "💻",
    entertainment: "🎮",
    other: "🎯",
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new savings goal</DialogTitle>
                <DialogDescription>Set a target amount and track your progress towards it.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    placeholder="New Phone"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Saving for the latest smartphone"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetAmount">Target Amount (Tokens)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    min="1"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGoal}>Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted rounded-t-lg" />
                <CardContent className="py-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100
              return (
                <Card key={goal.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{categoryIcons[goal.category] || "🎯"}</span>
                        <CardTitle>{goal.title}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        {goal.currentAmount} / {goal.targetAmount} Tokens
                      </span>
                      <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                  <CardFooter>
                    <Link href={`/goals/${goal.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        <Target className="mr-2 h-4 w-4" /> View Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first savings goal to start tracking your progress.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Goal
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
