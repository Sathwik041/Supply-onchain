"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

export const Breadcrumbs = () => {
  const pathname = usePathname();

  // Don't render breadcrumbs on the home page or if pathname is not ready
  if (!pathname || pathname === "/") return null;

  // Split paths into an array and filter out empty strings
  const pathNames = pathname.split("/").filter(path => path);

  const breadcrumbItems = [{ label: "Home", href: "/" }];

  // Inject Dashboard for routes that conceptually belong under it
  const dashboardRoutes = ["create", "orders", "machine-passports", "dispute-orders", "arbitration"];
  if (pathNames.length > 0 && dashboardRoutes.includes(pathNames[0])) {
    breadcrumbItems.push({ label: "Dashboard", href: "/dashboard" });
  }

  pathNames.forEach((link, index) => {
    const href = `/${pathNames.slice(0, index + 1).join("/")}`;
    const formattedLink = link
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    breadcrumbItems.push({ label: formattedLink, href: href });
  });

  return (
    <div className="w-full px-4 sm:px-6 py-4 bg-transparent z-10 sticky top-0 md:static">
      <nav className="flex max-w-7xl mx-auto" aria-label="Breadcrumb">
        <ol role="list" className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isFirst = index === 0;

            return (
              <li key={`${item.href}-${index}`}>
                <div className="flex items-center">
                  {!isFirst && (
                    <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-base-content/50 mx-1" aria-hidden="true" />
                  )}
                  {isLast ? (
                    <span
                      className="ml-2 text-sm font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary transition-colors flex items-center gap-1.5"
                      aria-current="page"
                    >
                      {isFirst && <HomeIcon className="h-4 w-4" />}
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={`ml-1 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-base-300/50 hover:text-base-content text-base-content/70 transition-colors flex items-center gap-1.5 ${isFirst ? "ml-0" : ""}`}
                    >
                      {isFirst && <HomeIcon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
