import { Book } from "./types";

export const books: Book[] = [
  {
    id: "1",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    isbn: "9780857197689",
    category: "Business",
    publicationYear: 2020,
    publisher: "Harriman House",
    description:
      "Timeless lessons on wealth, greed, and happiness. Doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people.",
    price: 19.99,
    status: "Available",
    coverImage: "https://m.media-amazon.com/images/I/81wZXiu4OiL._SL1500_.jpg",
    stock: 8,
    pageCount: 256,
    language: "English",
    tags: ["Finance", "Psychology", "Investing"],
    rating: 4.6,
    salesCount: 0,
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9781847941831",
    category: "Self-Help",
    publicationYear: 2018,
    publisher: "Random House Business",
    description:
      "An Easy & Proven Way to Build Good Habits & Break Bad Ones. No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
    price: 21.99,
    status: "Available",
    coverImage: "https://m.media-amazon.com/images/I/81ANaVZk5LL._SL1500_.jpg",
    stock: 12,
    pageCount: 320,
    language: "English",
    tags: ["Habits", "Self-Improvement", "Productivity"],
    rating: 4.8,
    salesCount: 0,
  },
  {
    id: "3",
    title: "Project Hail Mary",
    author: "Andy Weir",
    isbn: "9780593135204",
    category: "Fiction",
    publicationYear: 2021,
    publisher: "Ballantine Books",
    description:
      "A lone astronaut must save the earth from disaster in this incredible new science-based thriller from the #1 New York Times bestselling author of The Martian.",
    price: 24.99,
    status: "Available",
    coverImage: "https://m.media-amazon.com/images/I/81zD9kaVW9L._SL1500_.jpg",
    stock: 5,
    pageCount: 496,
    language: "English",
    tags: ["Science Fiction", "Space", "Adventure"],
    rating: 4.7,
    salesCount: 0,
  },
  {
    id: "4",
    title: "Dune",
    author: "Frank Herbert",
    isbn: "9780441172719",
    category: "Fiction",
    publicationYear: 1965,
    publisher: "Ace",
    description:
      "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange, a drug capable of extending life and enhancing consciousness.",
    price: 18.99,
    status: "Checked Out",
    coverImage: "https://m.media-amazon.com/images/I/81Ua99CURsL._SL1500_.jpg",
    stock: 0,
    pageCount: 896,
    language: "English",
    tags: ["Science Fiction", "Classic", "Fantasy"],
    rating: 4.7,
    salesCount: 0,
  },
];

export const getRelatedBooks = (book: Book, limit: number = 4): Book[] => {
  // Find books in the same category, excluding the current book
  return books
    .filter((b) => b.id !== book.id && b.category === book.category)
    .slice(0, limit);
};
