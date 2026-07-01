import { redirect } from "next/navigation";
import { getSeriesList } from "@/lib/queries";
import { createBook } from "@/lib/actions/books";
import { BookForm } from "@/components/BookForm";

export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  const seriesList = await getSeriesList();

  async function action(formData: FormData) {
    "use server";
    const id = await createBook(formData);
    redirect(`/library/${id}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Add a book</h1>
      <BookForm seriesList={seriesList} action={action} />
    </div>
  );
}
