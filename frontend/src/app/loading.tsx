
'use client'

export default function Loading() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">Loading...</h2>
            <p className="text-sm text-muted-foreground">Please wait while we prepare your content</p>
          </div>
        </div>
      </div>
    );
  }