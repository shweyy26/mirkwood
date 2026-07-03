import { redirect } from "next/navigation";
import { createBook } from "@/lib/actions/books";
import { BookForm } from "@/components/BookForm";

export const dynamic = "force-dynamic";

export default function NewBookPage() {
  async function action(formData: FormData) {
    "use server";
    const id = await createBook(formData);
    redirect(`/library/${id}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Add a book</h1>
      <BookForm action={action} />
    </div>
  );
}
