export type BookCategory =
  | "Action & Adventure"
  | "Animals"
  | "Anthropology"
  | "Art"
  | "Biography"
  | "Business"
  | "Children's Books"
  | "Classics"
  | "Comics"
  | "Contemporary"
  | "Cooking"
  | "Crafts & Hobbies"
  | "Crime"
  | "Drama"
  | "Dystopian"
  | "Economics"
  | "Education"
  | "Erotica"
  | "Essays"
  | "Family & Relationships"
  | "Fantasy"
  | "Fashion"
  | "Fiction"
  | "Food & Drink"
  | "Foreign Languages"
  | "Games & Activities"
  | "Graphic Novels"
  | "Health"
  | "Historical Fiction"
  | "History"
  | "Horror"
  | "Humor"
  | "Illustrated"
  | "Literary Criticism"
  | "Literature"
  | "Manga"
  | "Mathematics"
  | "Memoir"
  | "Music"
  | "Mystery"
  | "Mythology"
  | "Nature"
  | "Non-Fiction"
  | "Paranormal"
  | "Parenting & Families"
  | "Philosophy"
  | "Poetry"
  | "Politics"
  | "Psychology"
  | "Religion"
  | "Romance"
  | "Science"
  | "Science Fiction"
  | "Self-Help"
  | "Short Stories"
  | "Social Sciences"
  | "Sports & Recreation"
  | "Suspense"
  | "Technology"
  | "Thriller"
  | "Travel"
  | "True Crime"
  | "Young Adult";

export type BookStatus =
  | "Available"
  | "Checked Out"
  | "On Hold"
  | "Processing"
  | "Lost"
  | "Out of Stock";

export type PaymentMethod =
  | "Credit Card"
  | "Cash"
  | "PayPal"
  | "Bank Transfer"
  | "Other";

export type MemberStatus = "Active" | "Inactive" | "Suspended" | "Banned";

export interface Book {
  salesCount: number;
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  publicationYear: number;
  publisher: string;
  description: string;
  price: number;
  status: BookStatus;
  coverImage: string;
  stock: number;
  location?: string;
  rating?: number;
  pageCount?: number;
  language?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface CheckoutItem {
  id?: string;
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  transactionId?: string;
  dueDate?: Date;
}

export type TransactionStatus =
  | "Pending"
  | "Completed"
  | "Canceled"
  | "Returned";

export interface CheckoutTransaction {
  id: string;
  items: CheckoutItem[];
  totalAmount: number;
  date: Date;
  customerId?: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  returnDate?: Date;
  user_id?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalBooks: number;
  totalTransactions: number;
  totalUsers: number;
  recentTransactions: CheckoutTransaction[];
  popularBooks: Book[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  status: MemberStatus;
  joined_date: string;
  phone?: string;
  address?: string;
  booksCheckedOut?: number;
  user_id?: string;
}
