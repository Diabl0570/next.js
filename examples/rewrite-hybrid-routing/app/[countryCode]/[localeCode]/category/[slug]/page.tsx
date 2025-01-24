import Link from "next/link";
import React from "react";

const Page = () => {
  return (
    <>
      <h1>Homepage</h1>
      <Link href={"/nl/nl/category/cat-slug"}>Go to cat-slug</Link>
    </>
  );
};

export default Page;
