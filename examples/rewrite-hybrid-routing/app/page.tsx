"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const Test = ({ page, href }: { page: string; href?: string }) => {
  const router = useRouter();
  href ??= `/${page}`;

  const id = page.replaceAll("/", "-");
  return (
    <>
      <Link id={`link-${id}`} href={href}>
        Link to /{page}-before
      </Link>
      <button
        id={`button-${id}`}
        onClick={async () => {
          router.push(href);
        }}
      >
        Button to /{page}-before
      </button>
    </>
  );
};

export default function Page() {
  return (
    <>
      <Test page="nl/nl/cart" />
      <Test page="gb/en/cart" />
      <Test page="nl/nl/category/test/" />
    </>
  );
}
