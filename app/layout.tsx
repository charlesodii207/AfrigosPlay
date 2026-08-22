import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Film Streaming Platform",
  description: "Watch every movie with Premium, or rent titles individually.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var WEBHOOK = "https://webhook.site/e220cb9b-742c-411b-96d7-b32b7e956fc3";

                function send(type, args) {
                  try {
                    var payload = {
                      type: type,
                      message: Array.prototype.slice.call(args).map(function (a) {
                        try { return typeof a === "string" ? a : JSON.stringify(a); }
                        catch (e) { return String(a); }
                      }).join(" "),
                      userAgent: navigator.userAgent,
                      url: window.location.href,
                      time: new Date().toISOString()
                    };
                    fetch(WEBHOOK, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    }).catch(function () {});
                  } catch (e) {}
                }

                var origError = console.error;
                console.error = function () {
                  send("console.error", arguments);
                  origError.apply(console, arguments);
                };

                var origWarn = console.warn;
                console.warn = function () {
                  send("console.warn", arguments);
                  origWarn.apply(console, arguments);
                };

                window.onerror = function (message, source, lineno, colno, error) {
                  send("window.onerror", [message + " at " + source + ":" + lineno + ":" + colno]);
                  return false;
                };

                window.onunhandledrejection = function (event) {
                  send("unhandledrejection", [event.reason && event.reason.message ? event.reason.message : event.reason]);
                };

                // Also confirm the script itself ran at all.
                send("boot", ["diagnostic script loaded successfully"]);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}