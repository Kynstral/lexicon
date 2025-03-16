import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Info,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Book, BookCategory, BookStatus } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

type CsvRow = {
  title: string;
  author: string;
  isbn: string;
  category: string;
  publication_year: string;
  publisher: string;
  description?: string;
  price?: string;
  status?: string;
  stock?: string;
  language?: string;
  page_count?: string;
  location?: string;
  cover_image?: string;
  tags?: string;
  sales_count?: string;
};

const BulkBookImport = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number }>({
    success: 0,
    failed: 0,
  });
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      processFile(files[0]);
    }
  };

  const validateCsvRow = (
    row: CsvRow,
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!row.title) errors.push("Title is required");
    if (!row.author) errors.push("Author is required");
    if (!row.isbn) errors.push("ISBN is required");
    if (!row.category) errors.push("Category is required");
    if (!row.publication_year) errors.push("Publication year is required");
    if (!row.publisher) errors.push("Publisher is required");

    if (row.publication_year && isNaN(Number(row.publication_year))) {
      errors.push("Publication year must be a number");
    }

    if (row.price && isNaN(Number(row.price))) {
      errors.push("Price must be a number");
    }

    if (row.stock && isNaN(Number(row.stock))) {
      errors.push("Stock must be a number");
    }

    if (row.page_count && isNaN(Number(row.page_count))) {
      errors.push("Page count must be a number");
    }

    const validCategories = [
      "Fiction",
      "Non-Fiction",
      "Science Fiction",
      "Mystery",
      "Romance",
      "Biography",
      "History",
      "Self-Help",
      "Business",
      "Children",
      "Young Adult",
      "Poetry",
      "Reference",
      "Art",
      "Travel",
      "Religion",
      "Cooking",
      "Science",
      "Technology",
      "Other",
    ];

    if (row.category && !validCategories.includes(row.category)) {
      errors.push(`Category must be one of: ${validCategories.join(", ")}`);
    }

    const validStatuses = [
      "Available",
      "Checked Out",
      "On Hold",
      "Processing",
      "Lost",
      "Out of Stock",
    ];

    if (row.status && !validStatuses.includes(row.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    return { valid: errors.length === 0, errors };
  };

  const parseCsvFile = (text: string): CsvRow[] => {
    const rows = text.split("\n");

    const headers = rows[0]
      .split(",")
      .map((header) => header.trim().toLowerCase());

    const parsedRows: CsvRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;

      const values = rows[i].split(",").map((value) => value.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      parsedRows.push(row as CsvRow);
    }

    return parsedRows;
  };

  const convertToBook = (
    row: CsvRow,
    userId: string,
  ): Omit<Book, "id" | "created_at" | "updated_at"> => {
    return {
      title: row.title,
      author: row.author,
      isbn: row.isbn,
      category: row.category as BookCategory,
      publicationYear: parseInt(row.publication_year),
      publisher: row.publisher,
      description: row.description || "",
      price: row.price ? parseFloat(row.price) : 0,
      status: row.status ? (row.status as BookStatus) : "Available",
      stock: row.stock ? parseInt(row.stock) : 0,
      language: row.language || "",
      pageCount: row.page_count ? parseInt(row.page_count) : 0,
      location: row.location || "",
      coverImage: row.cover_image || "",
      tags: row.tags ? row.tags.split(";").map((tag) => tag.trim()) : [],
      rating: 0,
      salesCount: row.sales_count ? parseInt(row.sales_count) : 0,
      user_id: userId,
    };
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload a CSV file",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setShowResults(false);
      setProgress(0);

      const text = await file.text();
      const rows = parseCsvFile(text);

      if (rows.length === 0) {
        toast({
          variant: "destructive",
          title: "Empty file",
          description: "The CSV file doesn't contain any data",
        });
        setIsProcessing(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const { valid, errors } = validateCsvRow(row);

        if (valid && user) {
          const book = convertToBook(row, user.id);

          const { error } = await supabase.from("books").insert([
            {
              title: book.title,
              author: book.author,
              isbn: book.isbn,
              category: book.category,
              publication_year: book.publicationYear,
              publisher: book.publisher,
              description: book.description,
              price: book.price,
              status: book.status,
              stock: book.stock,
              language: book.language,
              page_count: book.pageCount,
              location: book.location,
              cover_image: book.coverImage,
              tags: book.tags,
              user_id: book.user_id,
            },
          ]);

          if (error) {
            console.error(`Error inserting book ${book.title}:`, error);
            failCount++;
          } else {
            successCount++;
          }
        } else {
          console.error(`Invalid row ${i + 1}:`, errors);
          failCount++;
        }

        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setResults({ success: successCount, failed: failCount });
      setShowResults(true);

      toast({
        title: "Import completed",
        description: `${successCount} books imported successfully, ${failCount} failed`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: "An unexpected error occurred while processing the file",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const refreshBookList = () => {
    queryClient.invalidateQueries({ queryKey: ["books"] });
    toast({
      title: "Book list refreshed",
      description: "The book list has been updated with your imported books",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Info size={16} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          CSV file should include columns: title, author, isbn, category,
          publication_year, publisher (required fields) and can include:
          description, price, status, stock, language, page_count, location,
          cover_image, tags (optional fields).
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Drag & Drop CSV File</h3>
        <p className="text-sm text-muted-foreground mb-4">
          or click the button below to select a file
        </p>
        <Button
          onClick={handleButtonClick}
          disabled={isProcessing}
          className="mx-auto"
        >
          <FileText className="h-4 w-4 mr-2" />
          Select CSV File
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".csv"
          className="hidden"
          disabled={isProcessing}
        />
      </div>

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-2">Importing books...</p>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {progress}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {showResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                  <p className="text-sm font-medium">
                    {results.success} books imported successfully
                  </p>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <p className="text-sm font-medium">
                      {results.failed} books failed to import
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={refreshBookList}
                variant="outline"
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Book List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkBookImport;
