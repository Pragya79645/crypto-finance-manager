import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Wallet, Target, BarChart3, Gift } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
          <span className="text-xl font-bold">CryptoSave</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/auth/login" className="text-sm font-medium hover:underline underline-offset-4">
            Login
          </Link>
          <Link href="/auth/register" className="text-sm font-medium hover:underline underline-offset-4">
            Register
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Learn Crypto Savings Without Risk
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Set financial goals, simulate savings with blockchain test tokens, and learn about Web3 in a fun,
                    risk-free environment.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth/register">
                    <Button size="lg" className="gap-1.5">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                    <Wallet className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">Connect Wallets</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Use Aptos testnet wallets to simulate savings
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                    <Target className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">Set Goals</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Create and track your financial goals
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">Track Progress</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Visualize your savings journey
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-2 border rounded-lg p-4">
                    <Gift className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold">Receive Donations</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Get support via Stellar testnet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t px-4 md:px-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 CryptoSave. All rights reserved.</p>
      </footer>
    </div>
  )
}
