"use client"

import Link from "next/link"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, ArrowRight, Copy, RefreshCw } from "lucide-react"
import { aptosClient } from "@/lib/aptos-client"
import { useToast } from "@/components/ui/use-toast"

export default function WalletPage() {
  const { user } = useAuth()
  const [walletAddress, setWalletAddress] = useState("")
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importKey, setImportKey] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        // Check if wallet is connected
        const savedWallet = localStorage.getItem("aptos_wallet")
        if (savedWallet) {
          setWalletAddress(savedWallet)

          // Get balance
          const walletBalance = await aptosClient.getBalance(savedWallet)
          setBalance(walletBalance)
        }
      } catch (error) {
        console.error("Error loading wallet data:", error)
        toast({
          variant: "destructive",
          title: "Error loading wallet",
          description: "Could not load wallet data. Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadWalletData()
    }
  }, [user, toast])

  const handleCreateWallet = async () => {
    try {
      // Create a new account
      const newAccount = aptosClient.createAccount()
      const address = newAccount.address().toString()

      // Fund the account with test tokens
      await aptosClient.fundAccount(newAccount)

      // Save the account
      localStorage.setItem("aptos_wallet", address)
      localStorage.setItem("aptos_private_key", newAccount.toPrivateKeyObject().privateKeyHex)

      setWalletAddress(address)
      setBalance(BigInt(100000000)) // Default faucet amount

      toast({
        title: "Wallet created",
        description: "Your Aptos testnet wallet has been created and funded with test tokens.",
      })
    } catch (error) {
      console.error("Error creating wallet:", error)
      toast({
        variant: "destructive",
        title: "Wallet creation failed",
        description: "Could not create Aptos wallet. Please try again.",
      })
    }
  }

  const handleImportWallet = async () => {
    try {
      if (!importKey) {
        toast({
          variant: "destructive",
          title: "Import failed",
          description: "Please enter a private key.",
        })
        return
      }

      // Import account from private key
      const account = aptosClient.importAccount(importKey)
      const address = account.address().toString()

      // Save the account
      localStorage.setItem("aptos_wallet", address)
      localStorage.setItem("aptos_private_key", importKey)

      // Get balance
      const walletBalance = await aptosClient.getBalance(address)

      setWalletAddress(address)
      setBalance(walletBalance)
      setImportKey("")

      toast({
        title: "Wallet imported",
        description: "Your Aptos wallet has been imported successfully.",
      })
    } catch (error) {
      console.error("Error importing wallet:", error)
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "Invalid private key. Please check and try again.",
      })
    }
  }

  const handleRefreshBalance = async () => {
    try {
      if (!walletAddress) return

      setRefreshing(true)
      const walletBalance = await aptosClient.getBalance(walletAddress)
      setBalance(walletBalance)

      toast({
        title: "Balance updated",
        description: "Your wallet balance has been refreshed.",
      })
    } catch (error) {
      console.error("Error refreshing balance:", error)
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not refresh wallet balance. Please try again.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleRequestTokens = async () => {
    try {
      if (!walletAddress) return

      // Get private key
      const privateKeyHex = localStorage.getItem("aptos_private_key")
      if (!privateKeyHex) {
        throw new Error("Private key not found")
      }

      // Import account
      const account = aptosClient.importAccount(privateKeyHex)

      // Request tokens from faucet
      await aptosClient.fundAccount(account)

      // Refresh balance
      const walletBalance = await aptosClient.getBalance(walletAddress)
      setBalance(walletBalance)

      toast({
        title: "Tokens received",
        description: "Your wallet has been funded with test tokens.",
      })
    } catch (error) {
      console.error("Error requesting tokens:", error)
      toast({
        variant: "destructive",
        title: "Request failed",
        description: "Could not request test tokens. Please try again later.",
      })
    }
  }

  const handleDisconnectWallet = () => {
    localStorage.removeItem("aptos_wallet")
    localStorage.removeItem("aptos_private_key")
    setWalletAddress("")
    setBalance(BigInt(0))

    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Aptos Wallet</h1>

        {loading ? (
          <Card className="animate-pulse">
            <CardHeader className="h-24 bg-muted rounded-t-lg" />
            <CardContent className="py-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ) : walletAddress ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Details</CardTitle>
                <CardDescription>Your Aptos testnet wallet information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Wallet Address</Label>
                  <div className="flex items-center">
                    <div className="bg-muted p-2 rounded-md text-sm font-mono flex-1 overflow-hidden text-ellipsis">
                      {walletAddress}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(walletAddress)
                        toast({
                          title: "Address copied",
                          description: "Wallet address copied to clipboard",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Balance</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={handleRefreshBalance}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  <div className="bg-muted p-2 rounded-md text-sm font-mono">{balance.toString()} APT</div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full" onClick={handleRequestTokens}>
                  Request Test Tokens
                </Button>
                <Button variant="outline" className="w-full" onClick={handleDisconnectWallet}>
                  Disconnect Wallet
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Transactions</CardTitle>
                <CardDescription>Simulate transactions on the Aptos testnet</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This wallet is connected to the Aptos testnet. You can use it to simulate deposits to your savings
                  goals without using real money.
                </p>
                <div className="space-y-2">
                  <Label>How to use:</Label>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to any of your savings goals</li>
                    <li>Click "Make a Deposit" to allocate test tokens</li>
                    <li>Track your progress as you save toward your goals</li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/goals">
                    View Your Goals <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="create">Create Wallet</TabsTrigger>
              <TabsTrigger value="import">Import Wallet</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Create a New Wallet</CardTitle>
                  <CardDescription>Generate a new Aptos testnet wallet for simulating savings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will create a new Aptos wallet on the testnet and fund it with test tokens. You can use these
                    tokens to simulate deposits to your savings goals.
                  </p>
                  <div className="flex items-center justify-center p-6">
                    <Wallet className="h-16 w-16 text-muted-foreground" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleCreateWallet}>
                    Create Wallet
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle>Import Existing Wallet</CardTitle>
                  <CardDescription>Connect an existing Aptos wallet using your private key</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your Aptos private key to import an existing wallet.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="privateKey">Private Key</Label>
                    <Input
                      id="privateKey"
                      type="password"
                      placeholder="Enter your private key"
                      value={importKey}
                      onChange={(e) => setImportKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your private key is stored locally and never sent to our servers.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleImportWallet}>
                    Import Wallet
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
