import PdfViewer from "@/components/PdfViewer";

export default async function ViewerPage({ params, searchParams }: { params:Promise<{id:string}>; searchParams:Promise<{page?:string}> }) {
  const [{id},query]=await Promise.all([params,searchParams]); const page=Math.max(1,Number.parseInt(query.page??"1",10)||1);
  return <PdfViewer documentId={id} initialPage={page}/>;
}
