import { SpendingForm } from "@/components/SpendingForm"

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Credit Card Optimizer Dashboard
          </h1>
          <p className="text-gray-600">
            Tell us about your spending to get personalized credit card recommendations
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <SpendingForm />
        </div>
      </div>
    </main>
  )
} 