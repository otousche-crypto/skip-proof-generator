"use client";

import Link from "next/link";
import { NavAuth } from "@/components/NavAuth";

export function Navbar({ fixed = true }: { fixed?: boolean }) {
  return (
    <nav className={`flex items-center justify-center px-6 py-4 ${fixed ? "fixed top-0 left-0 right-0 z-50" : "relative shrink-0"}`}>
      <Link href="/" className="text-xl font-bold text-white">
        Sklip
      </Link>
      <div className="absolute right-6">
        <NavAuth />
      </div>
    </nav>
  );
}
