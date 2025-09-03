import { Trophy, Shield } from "lucide-react"
import { Link } from "react-router-dom"

export function Header() {
  return (
    <header className="bg-black border-t border-white/10 py-8 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-4">
          <Shield className="h-10 w-10 text-primary-foreground" />
          <div className="text-center">
            <h1 className="text-4xl font-heading font-black text-primary-foreground tracking-tight">
              <Link to="/">FOOTBALL TRIVIA PRO</Link>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-1 w-8 bg-secondary rounded-full"></div>
              <span className="text-primary-foreground/90 font-medium text-sm tracking-wider">
                PREMIER • LA LIGA • CHAMPIONS
              </span>
              <div className="h-1 w-8 bg-secondary rounded-full"></div>
            </div>
          </div>
          <Trophy className="h-10 w-10 text-secondary" />
        </div>
        <p className="text-center text-primary-foreground/80 mt-4 text-lg font-medium">
          Test your football knowledge like a pro
        </p>
      </div>
    </header>
  )
}
