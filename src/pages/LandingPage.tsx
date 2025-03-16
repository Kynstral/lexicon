import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart,
  BookMarked,
  ChevronRight,
  Clock,
  Info,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthStatusProvider";

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <img src="/logo.png" alt="Lexicon" className="w-10 h-10" />
            <span className="text-xl font-bold tracking-tight">Lexicon</span>
          </Link>

          <nav className="hidden md:flex gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
              id="features"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Testimonials
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 px-4 font-medium"
                >
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="shadow-sm px-4 font-medium">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-36 bg-gradient-to-br from-background via-background to-primary/10">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2 items-center">
            <div className="flex flex-col justify-center space-y-5">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 w-fit">
                Library Management Simplified
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Modern Library{" "}
                  <span className="text-primary">Management</span> Solution
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                  Streamline your library operations with our comprehensive
                  management system. From efficient cataloging to member
                  management and insightful analytics — all in one intuitive
                  platform.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row pt-2">
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="gap-1.5 shadow-md font-medium px-6"
                  >
                    Get Started Free
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-1.5 font-medium"
                  >
                    Learn More
                    <Info className="h-4 w-4 ml-1" />
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Free 14-day trial</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full overflow-hidden rounded-xl shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2300&auto=format&fit=crop"
                  alt="Modern library interior with bookshelves and reading areas"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last transition-transform duration-700 hover:scale-105"
                  width={600}
                  height={360}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent"></div>
                <div className="absolute bottom-4 left-4 rounded-lg bg-background/90 backdrop-blur p-3 shadow-lg border border-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">
                      Used by 2,300+ libraries worldwide
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="w-full py-16 md:py-24 lg:py-32 bg-muted/30"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground w-fit">
              Powerful Features
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Everything You Need to{" "}
                <span className="text-primary">Transform</span> Your Library
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                Our platform provides a comprehensive set of tools to streamline
                library operations and enhance the experience for both staff and
                patrons.
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
            <div className="group flex flex-col h-full space-y-4 rounded-xl border p-6 shadow-sm bg-card hover:shadow-md transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px]">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <BookMarked className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Smart Cataloging
                </h3>
                <p className="text-muted-foreground">
                  Easily manage your collection with powerful cataloging
                  features including bulk imports, custom fields, and automatic
                  metadata retrieval.
                </p>
              </div>
            </div>

            <div className="group flex flex-col h-full space-y-4 rounded-xl border p-6 shadow-sm bg-card hover:shadow-md transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px]">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Member Management
                </h3>
                <p className="text-muted-foreground">
                  Keep track of members, manage subscriptions, and customize
                  access privileges with an intuitive and powerful management
                  system.
                </p>
              </div>
            </div>

            <div className="group flex flex-col h-full space-y-4 rounded-xl border p-6 shadow-sm bg-card hover:shadow-md transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px]">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Search className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Advanced Search
                </h3>
                <p className="text-muted-foreground">
                  Powerful search capabilities with filters and suggestions make
                  finding any item in your collection fast and intuitive for
                  both staff and patrons.
                </p>
              </div>
            </div>

            <div className="group flex flex-col h-full space-y-4 rounded-xl border p-6 shadow-sm bg-card hover:shadow-md transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px]">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <BarChart className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Real-time Analytics
                </h3>
                <p className="text-muted-foreground">
                  Get actionable insights into library usage, popular items, and
                  member activity with detailed customizable reports and
                  dashboards.
                </p>
              </div>
            </div>

            <div className="group flex flex-col h-full space-y-4 rounded-xl border p-6 shadow-sm bg-card hover:shadow-md transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px]">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Checkout System
                </h3>
                <p className="text-muted-foreground">
                  Streamline the checkout process with automated due date
                  calculations, self-checkout options, and flexible renewal
                  settings.
                </p>
              </div>
            </div>

            <div className="group flex flex-col h-full space-y-4 rounded-xl border p-6 shadow-sm bg-card hover:shadow-md transition-all duration-300 hover:border-primary/30 hover:translate-y-[-4px]">
              <div className="rounded-full bg-primary/10 p-3 w-14 h-14 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7 text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Notifications & Reminders
                </h3>
                <p className="text-muted-foreground">
                  Automatically send due date reminders, overdue notices, and
                  availability notifications through email, SMS, or in-app
                  messages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="w-full py-16 md:py-24 lg:py-32 bg-background"
      >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground w-fit">
              Success Stories
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Trusted by <span className="text-primary">Librarians</span>{" "}
                Worldwide
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Hear what library professionals have to say about their
                experience with Lexicon
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="mb-4">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-star"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-base italic leading-relaxed text-muted-foreground">
                  "Lexicon has transformed how we manage our university library.
                  The cataloging system is intuitive and the analytics help us
                  make better purchasing decisions based on actual usage
                  patterns."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">SJ</span>
                </div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">
                    University Librarian
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="mb-4">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-star"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-base italic leading-relaxed text-muted-foreground">
                  "The member management features have saved us countless hours.
                  Our patrons love the self-service options and automated
                  notifications. Implementation was incredibly smooth."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">DC</span>
                </div>
                <div>
                  <p className="font-semibold">David Chen</p>
                  <p className="text-sm text-muted-foreground">
                    Public Library Director
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="mb-4">
                <div className="flex gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-star"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-base italic leading-relaxed text-muted-foreground">
                  "As a small community library, we needed something affordable
                  yet powerful. Lexicon exceeded our expectations in every way.
                  The support team has been exceptional throughout."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">ER</span>
                </div>
                <div>
                  <p className="font-semibold">Emma Rodriguez</p>
                  <p className="text-sm text-muted-foreground">
                    Community Library Coordinator
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-6">
              Trusted by libraries across the globe
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <img
                src="/example_1.png"
                alt="Client logo"
                className="h-12 w-12"
              />
              <img
                src="/example_2.png"
                alt="Client logo"
                className="h-12 w-12"
              />
              <img
                src="/example_3.png"
                alt="Client logo"
                className="h-12 w-12"
              />
              <img
                src="/example_4.png"
                alt="Client logo"
                className="h-12 w-12"
              />
              <img
                src="/example_5.png"
                alt="Client logo"
                className="h-12 w-12"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-muted/50 via-muted/30 to-background"
      >
        <div className="container px-4 md:px-6 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground w-fit mx-auto mb-4">
              Beta Access Available Now
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight mb-4">
              Ready to Transform Your Library?
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              Join thousands of libraries that trust Lexicon for their
              management needs. During our beta period, get complete access for
              free.
            </p>

            <div className="mb-10 bg-card border rounded-xl shadow-lg p-8 md:p-10">
              <div className="flex flex-col items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium mb-3">
                  Limited Time Beta Offer
                </span>
                <h3 className="text-2xl font-bold mb-2">Free Beta Access</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-bold text-primary">$0</span>
                  <span className="text-lg text-muted-foreground ml-2">
                    /month
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-8">
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Unlimited books</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Unlimited members</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>All premium features</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 text-primary mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Priority support</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                  <Link to="/auth" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="gap-1.5 px-8 shadow-md font-medium w-full"
                    >
                      Get Started Free
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#features" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-medium w-full"
                    >
                      Book a Demo
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required. Access all features during the beta
              period.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <img
                    src="/logo.png"
                    alt="lexicon-footer-logo"
                    className="h-5 w-5"
                  />
                </div>
                <span className="text-xl font-bold">Lexicon</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                The modern way to manage your library's resources and patrons.
                Trusted by institutions of all sizes around the world.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Twitter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label="GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Updates
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Guides
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-b py-8 my-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="md:max-w-md">
                <h3 className="font-semibold mb-2">Stay updated</h3>
                <p className="text-sm text-muted-foreground">
                  Subscribe to our newsletter for the latest updates, features,
                  and library management tips.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 text-sm border rounded-md w-full sm:w-auto min-w-[220px]"
                />
                <Button className="w-full sm:w-auto">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Lexicon. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
