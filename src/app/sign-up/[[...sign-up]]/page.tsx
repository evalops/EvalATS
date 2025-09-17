import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign Up</h1>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-black hover:bg-gray-800 text-white',
              card: 'shadow-lg border border-gray-200',
            },
          }}
          signInUrl="/sign-in"
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}