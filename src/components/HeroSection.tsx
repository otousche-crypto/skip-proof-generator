"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

export function HeroSection({ imageUrl }: { imageUrl: string }) {
  return (
    <section className="relative flex min-h-[700px] h-screen w-full items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden="true"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-black/50" aria-hidden="true" />

      {/* Content */}
      <motion.div
        className="z-10 flex max-w-4xl flex-col items-center justify-center text-center px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-white"
          variants={itemVariants}
        >
          Crée des boucles{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)" }}
          >
            skip-proof
          </span>{" "}
          pour le scratch
        </motion.h1>

        <motion.p
          className="mt-6 max-w-2xl text-lg leading-8 md:text-xl text-white/80"
          variants={itemVariants}
        >
          Assemble des samples sur un vinyle de 1818ms, ajuste le pitch et
          exporte en MP3. Gratuit, sans compte.
        </motion.p>

        <motion.div className="mt-10" variants={itemVariants}>
          <Link
            href="/composer"
            className="px-8 py-3 rounded-[var(--radius-sm)] font-bold text-white text-lg transition-opacity hover:opacity-90"
            style={{ backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)" }}
          >
            Commencer
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
