"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Gift, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { deskreeClient } from "@/lib/deskree"
import { stellarClient } from "@/lib/stellar-client"

export default function DonatePage() {
  const { user } = useAuth()
  const [goalId, setGoalId] = useState("")
  const [amount, setAmount] = useState(10)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [donationComplete, setDonationComplete] = useState(false)
  const [stellarAccount, setStellarAccount] = useState<any>(null)
  const { toast } = useToast()

  const handleCreateStellarAccount = async () => {
    try {
      setLoading(true)

      // Create a new Stellar keypair
      const keypair = stellarClient.createKeypair()

      // Create and fund the account on testnet
      await stellarClient.createAccount(keypair.publicKey())

      // Save the keypair
      setStellarAccount({
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret(),
      })

      toast({
        title: "Stellar account created",
        description: "Your testnet account has been created and funded with test XLM.",
      })
    } catch (error) {
      console.error("Error creating Stellar account:", error)
      toast({
        variant: "destructive",
        title: "Account creation failed",
        description: "Could not create Stellar testnet account. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDonate = async () => {
    try {
      if (!stellarAccount || !goalId || amount <= 0) {
        toast({
          variant: "destructive",
          title: "Donation failed",
          description: "Please fill in all required fields.",
        })
        return
      }

      setLoading(true)

      // Get goal details
      const goalResponse = await deskreeClient.database.getById("goals", goalId)

      if (!goalResponse) {
        throw new Error("Goal not found")
      }

      // Create a keypair from the secret key
      const keypair = stellarClient.createKeypair()

      // Send the donation
      await stellarClient.sendDonation(
        keypair,
        "GDZKZPFT6XBXGG6BWQYUSMKF6GRBVYOTWCNFPI4JTGQO4YGHXZT7XRJR", // Example recipient address (in a real app, this would be the user's Stellar address)
        amount.toString(),
        message || `Donation for ${goalResponse.title}`,
      )

      // Record the donation in our database
      const transactionData = {
        amount,
        type: "donation",
        goalId,
        goalTitle: goalResponse.title,
        userId: goalResponse.userId,
        timestamp: new Date().toISOString(),
        sender: stellarAccount.publicKey,
        message,
      }

      await deskreeClient.database.create("transactions", transactionData)

      // Update the goal's current amount
      await deskreeClient.database.update("goals", goalId, {
        currentAmount: goalResponse.currentAmount + amount,
      })

      setDonationComplete(true)

      toast({
        title: "Donation successful",
        description: `You've donated ${amount} XLM to ${goalResponse.title}.`,
      })
    } catch (error) {
      console.error("Error making donation:", error)
      toast({
        variant: "destructive",
        title: "Donation failed",
        description: "Could not complete your donation. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Donate with Stellar</h1>

        {donationComplete ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Donation Complete!</CardTitle>
              <CardDescription className="text-center">Thank you for your generous donation</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Gift className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center mb-4">Your donation of {amount} XLM has been sent successfully.</p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  setDonationComplete(false)
                  setGoalId("")
                  setAmount(10)
                  setMessage("")
                }}
              >
                Make Another Donation
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : stellarAccount ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Make a Donation</CardTitle>
                <CardDescription>Support a student's savings goal with Stellar XLM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goalId">Goal ID or Link</Label>
                  <Input
                    id="goalId"
                    placeholder="Enter goal ID or paste donation link"
                    value={goalId}
                    onChange={(e) => {
                      // Extract goal ID if a full URL is pasted
                      const input = e.target.value
                      if (input.includes("/donate/")) {
                        const parts = input.split("/donate/")
                        setGoalId(parts[1])
                      } else {
                        setGoalId(input)
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (XLM)</Label>
                  <Select value={amount.toString()} onValueChange={(value) => setAmount(Number(value))}>
                    <SelectTrigger id="amount">
                      <SelectValue placeholder="Select amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 XLM</SelectItem>
                      <SelectItem value="10">10 XLM</SelectItem>
                      <SelectItem value="25">25 XLM</SelectItem>
                      <SelectItem value="50">50 XLM</SelectItem>
                      <SelectItem value="100">100 XLM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Input
                    id="message"
                    placeholder="Add a message with your donation"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleDonate} disabled={loading || !goalId}>
                  {loading ? "Processing..." : "Send Donation"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Stellar Account</CardTitle>
                <CardDescription>Testnet account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <div className="bg-muted p-2 rounded-md text-sm font-mono break-all">{stellarAccount.publicKey}</div>
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="bg-muted p-2 rounded-md text-sm font-mono break-all">{stellarAccount.secretKey}</div>
                  <p className="text-xs text-muted-foreground">
                    This is a testnet account. In a real application, never share your secret key.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://laboratory.stellar.org/#explorer?resource=accounts&endpoint=single&values=eyJhY2NvdW50X2lkIjoiJHtzdGVsbGFyQWNjb3VudC5wdWJsaWNLZXl9In0%3D`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Stellar Explorer <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create a Stellar Account</CardTitle>
              <CardDescription>Set up a testnet account to make donations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                To donate to a student's savings goal, you'll need a Stellar testnet account. This will create a new
                account and fund it with test XLM tokens.
              </p>
              <div className="flex items-center justify-center p-6">
                <Gift className="h-16 w-16 text-muted-foreground" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleCreateStellarAccount} disabled={loading}>
                {loading ? "Creating Account..." : "Create Stellar Account"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  )
}
