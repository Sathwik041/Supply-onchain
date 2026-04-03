"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import {
  Bars3Icon,
  HomeIcon,
  InformationCircleIcon,
  PlusCircleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { NotificationBell } from "~~/components/NotificationBell";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    label: "Create",
    href: "/create",
    icon: <PlusCircleIcon className="h-4 w-4" />,
  },
  {
    label: "Arbitration",
    href: "/arbitration",
    icon: <ShieldCheckIcon className="h-4 w-4" />,
  },
  {
    label: "About",
    href: "/about",
    icon: <InformationCircleIcon className="h-4 w-4" />,
  },
  {
    label: "FAQs",
    href: "/faqs",
    icon: <QuestionMarkCircleIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 shadow-md shadow-secondary px-1 sm:px-2">
      <div className="navbar-start w-auto">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" passHref className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-4 mr-2 sm:mr-6 shrink-0">
          <div className="flex relative w-8 h-8 sm:w-10 sm:h-10">
            <Image alt="Supply-Onchain logo" className="cursor-pointer" fill src="/logo-new.png" />
          </div>
          <span className="font-bold hidden sm:block md:text-2xl leading-tight">SUPPLY-ONCHAIN</span>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-1 sm:mr-4 gap-1 sm:gap-2 flex-nowrap">
        <NotificationBell />
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
