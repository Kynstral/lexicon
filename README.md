## Lexicon: Simplify Your Library Management

Lexicon is a modern, user-friendly library management system (LMS) built to make managing your library or bookstore easier and more efficient. It's designed for both library staff and patrons, offering a clean interface and powerful features to handle everything from cataloging books to tracking circulation. Lexicon is built with React, Tailwind CSS, and Supabase, making it fast, responsive, and secure.

## Demo:

### Demo Credentials:

**Book Store Account:** `example@book.com / 123456`
**Library Account:** `example@library.com / 123456`

- **Library Demo:**

  https://github.com/user-attachments/assets/d344c74f-885a-4d26-ab60-af8f42e1e6b8

* **Book Store Demo:**

  https://github.com/user-attachments/assets/206978c0-e332-4bc8-b9c2-eed373575cd4

**Why Choose Lexicon?**

- **Streamlined Operations:** Lexicon automates many tedious tasks, like tracking due dates, generating reports, and managing member information. This frees up your time to focus on what matters most: connecting people with books.

- **Improved User Experience:** A clean, intuitive interface makes it easy for staff to manage the library and for patrons to find what they need. The responsive design works seamlessly on desktops, tablets, and phones.

- **Comprehensive Features:** Lexicon offers a complete set of features, including:

- **Detailed book cataloging:** Manage title, author, ISBN, category, publisher, description, price, stock, and more. Bulk import/export via CSV is supported.

- **Member management:** Keep track of members, their contact information, and their borrowing history.

- **Automated circulation:** Check books in and out, automatically calculate due dates, and send overdue reminders (with setup).

- **Powerful search and filtering:** Quickly find books and members using a variety of criteria.

- **Role-based access:** Separate dashboards and permissions for library staff and bookstore owners.

- **Real-time analytics:** Get insights into popular books, lending trends, and library usage.

- **Bookstore Functionality:** In addition to library features, Lexicon support bookstore requirements, such as checkout process, inventory, and sales tracking.

- **Open Source and Customizable:** Lexicon is built with popular, open-source technologies, making it flexible and adaptable to your specific needs.

- **Easy Setup:** With Supabase handling the backend, deployment is straightforward.

**Who is Lexicon for?**

- Small to medium-sized libraries

- School libraries

- Community libraries

- Bookstores

- Personal book collections (with a bit of adaptation)

- Anyone who wants a modern, efficient way to manage a collection of books

**How Lexicon Works (Technical Overview):**

Lexicon is a full-stack web application. The frontend is built with React and Tailwind CSS, providing a responsive and interactive user interface. The backend uses Supabase, a powerful open-source alternative to Firebase. Supabase provides:

- **PostgreSQL Database:** A robust and scalable database to store all book, member, and transaction data.

- **Authentication:** Secure user authentication and authorization, with built-in support for email/password login (and easy integration with social logins).

- **Realtime Subscriptions:** The application can listen for changes in the database and update the UI automatically.

- **Storage:** Option to store files (like book covers) directly in Supabase Storage.

- **Row Level Security (RLS):** Ensures that users can only access and modify data they are authorized to see. This is _critical_ for data privacy and security.

The React frontend uses React Query for data fetching and caching, making the application feel fast and responsive. Components from Shadcn/ui and Radix UI provide a polished, accessible user experience.

**Building, Installing, and Running Lexicon:**

1.  **Prerequisites:**

- Node.js (LTS version recommended) and npm (or yarn/pnpm) installed.

- A Supabase account and a new project created.

- Git

2.  **Clone the Repository:**

```bash

git clone https://github.com/Kynstral/lexicon.git

cd lexicon

```

3.  **Install Dependencies:**

```bash

npm install
//
bun install
```

4.  **Set up Supabase:**

- Create project on your supabase copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` , populate values in .env.

5.  **Environment Variables:**

- Create a `.env` file in the project root.

- Copy the contents of `.env.example` into `.env`.

- Replace the placeholder values with your Supabase project URL and Anon Key (found in your Supabase project settings).

6.  **Run the Application:**

```bash

npm run dev
// or

bun run dev
```

This will start the development server, typically on `http://localhost:3000`. Open this URL in your browser.

7.  **Deployment**

- **Build the application:**

```bash

npm run build

```

- Deploy the `dist` folder to your preferred hosting provider (Netlify, Vercel, AWS Amplify, etc.). Remember to set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables on your hosting provider.

Lexicon provides a modern, efficient, and user-friendly solution for managing your library. Get started today and experience the difference!
