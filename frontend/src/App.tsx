import { Button } from "@/components/ui/button"

function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          ProyectoU
        </h1>

        <p className="text-muted-foreground">
          React + Vite + shadcn/ui
        </p>

        <Button>
          Mi primer botón
        </Button>
      </div>
    </main>
  )
}

export default App