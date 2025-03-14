// App.tsx
"use client"
import "./App.css"
import { Amplify } from "aws-amplify"
import { Authenticator, withAuthenticator } from '@aws-amplify/ui-react';
import "@aws-amplify/ui-react/styles.css"
import awsExports from "./aws-exports"
import WildfireMap from "./WildfireMap" 
Amplify.configure(awsExports)

function App() {
  return (
    <div className="App" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Authenticator>
        {({ signOut }) => (
          <main style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <header className="App-header" style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              <h1 style={{ margin: 0, fontSize: "1.5rem" }}>California Wildfire Risk Analysis</h1>
              <button
                onClick={signOut}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "20px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer"
                }}
              >
                Sign Out
              </button>
            </header>
            {/* Show WildfireMap after login with flex-grow to fill available space */}
            <div style={{ flexGrow: 1, minHeight: 0 }}>
              <WildfireMap />
            </div>
          </main>
        )}
      </Authenticator>
    </div>
  )
}


export default withAuthenticator(App);