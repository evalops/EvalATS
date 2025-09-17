import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to ATS</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your recruitment pipeline</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-black hover:bg-gray-800 text-white',
              card: 'shadow-lg border border-gray-200',
            },
          }}
          signUpUrl="/sign-up"
          forceRedirectUrl="/"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  )
}