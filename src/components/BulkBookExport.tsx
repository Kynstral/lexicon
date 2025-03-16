// noinspection ExceptionCaughtLocallyJS

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface BulkBookExportProps {
  selectedBooks?: string[];
}

const BulkBookExport = ({ selectedBooks }: BulkBookExportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const exportBooks = async () => {
    try {
      setIsExporting(true);

      let query = supabase.from("books").select("*").order("title");

      if (user) {
        query = query.eq("user_id", user.id);
      }

      if (selectedBooks && selectedBooks.length > 0) {
        query = query.in("id", selectedBooks);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast({
          title: "No books to export",
          description: "There are no books available to export",
        });
        return;
      }

      const headers = [
        "title",
        "author",
        "isbn",
        "category",
        "publication_year",
        "publisher",
        "description",
        "price",
        "status",
        "stock",
        "language",
        "page_count",
        "location",
        "cover_image",
        "tags",
        "rating",
      ];

      let csvContent = headers.join(",") + "\n";

      data.forEach((book) => {
        const row = [
          `"${book.title?.replace(/"/g, '""') || ""}"`,
          `"${book.author?.replace(/"/g, '""') || ""}"`,
          `"${book.isbn?.replace(/"/g, '""') || ""}"`,
          `"${book.category?.replace(/"/g, '""') || ""}"`,
          `${book.publication_year || ""}`,
          `"${book.publisher?.replace(/"/g, '""') || ""}"`,
          `"${book.description ? book.description.replace(/"/g, '""') : ""}"`,
          `${book.price || ""}`,
          `"${book.status?.replace(/"/g, '""') || ""}"`,
          `${book.stock || ""}`,
          `"${book.language ? book.language.replace(/"/g, '""') : ""}"`,
          `${book.page_count || ""}`,
          `"${book.location ? book.location.replace(/"/g, '""') : ""}"`,
          `"${book.cover_image ? book.cover_image.replace(/"/g, '""') : ""}"`,
          `"${book.tags ? book.tags.join(";").replace(/"/g, '""') : ""}"`,
          `${book.rating || ""}`,
        ];

        csvContent += row.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      const filename =
        selectedBooks && selectedBooks.length > 0
          ? `selected_books_export_${new Date().toISOString().slice(0, 10)}.csv`
          : `books_export_${new Date().toISOString().slice(0, 10)}.csv`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `${data.length} books exported to CSV`,
      });
    } catch (error) {
      console.error("Error exporting books:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "An error occurred while exporting books",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Export Books</h3>
            <p className="text-sm text-muted-foreground">
              {selectedBooks && selectedBooks.length > 0
                ? `Download ${selectedBooks.length} selected book(s) as a CSV file`
                : "Download all your books as a CSV file"}
            </p>
          </div>
          <Button onClick={exportBooks} disabled={isExporting} className="ml-4">
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export as CSV"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkBookExport;
