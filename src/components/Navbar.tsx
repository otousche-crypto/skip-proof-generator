"use client";

import Link from "next/link";
import { NavAuth } from "@/components/NavAuth";

export function Navbar() {
  return (
    <nav className="flex items-center justify-center h-16 px-6 fixed top-0 left-0 right-0 z-50">
      <Link href="/" className="text-xl font-bold text-white">
        Sklip
      </Link>
      <div className="absolute right-6">
        <NavAuth />
      </div>
    </nav>
  );
}
