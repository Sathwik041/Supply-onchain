"use client";

import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { useAccount, usePublicClient } from "wagmi";
import {
  ArrowTopRightOnSquareIcon,
  DocumentMagnifyingGlassIcon,
  IdentificationIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract, useTargetNetwork } from "~~/hooks/scaffold-eth";

interface PassportNFT {
  tokenId: number;
  uri: string;
  metadata?: any;
}

const MachinePassports: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();
  const [passports, setPassports] = useState<PassportNFT[]>([]);

  // Fetch passport contract address
  const { data: passportContractAddress } = useScaffoldReadContract({
    contractName: "EscrowFactory",
    functionName: "passportContract",
  });

  // Fetch Owned NFTs
  useEffect(() => {
    const fetchPassports = async () => {
      // Return early if no connection
      if (!passportContractAddress || !connectedAddress || !publicClient) return;

      const chainId = publicClient.chain.id;
      const machinePassportAbi = (deployedContracts as any)[chainId].MachinePassport.abi;

      try {
        const balance = await publicClient.readContract({
          address: passportContractAddress as `0x${string}`,
          abi: machinePassportAbi,
          functionName: "balanceOf",
          args: [connectedAddress],
        });

        const nftData: PassportNFT[] = [];
        for (let i = 0; i < Number(balance); i++) {
          const tokenId = await publicClient.readContract({
            address: passportContractAddress as `0x${string}`,
            abi: machinePassportAbi,
            functionName: "tokenOfOwnerByIndex",
            args: [connectedAddress, BigInt(i)],
          });

          const uri = await publicClient.readContract({
            address: passportContractAddress as `0x${string}`,
            abi: machinePassportAbi,
            functionName: "tokenURI",
            args: [tokenId],
          });

          let metadata = null;
          try {
            const metaRes = await fetch(`https://gateway.pinata.cloud/ipfs/${uri}`);
            const text = await metaRes.text();
            try {
              metadata = JSON.parse(text);
            } catch {
              // Not JSON
            }
          } catch (e) {
            console.warn("Could not fetch metadata for token", tokenId, e);
          }

          nftData.push({ tokenId: Number(tokenId), uri: uri as string, metadata });
        }

        setPassports(nftData);
      } catch (error) {
        console.error("Error fetching passports:", error);
      }
    };

    fetchPassports();
  }, [passportContractAddress, connectedAddress, publicClient]);

  return (
    <div className="flex flex-col grow bg-base-200 pb-20">
      <div className="max-w-7xl w-full mx-auto px-4 mt-8">
        <h1 className="text-3xl font-black text-secondary mb-10 flex items-center gap-3">
          <IdentificationIcon className="h-10 w-10 text-primary" />
          My Machine Passports
        </h1>

        {!connectedAddress ? (
          <div className="card bg-base-100 shadow-xl border border-secondary/20 p-20 text-center rounded-sm">
            <h2 className="text-2xl font-bold opacity-50 mb-2">Connect Your Wallet</h2>
            <p className="opacity-40 text-lg">Please connect your wallet to view your owned passports.</p>
          </div>
        ) : passports.length === 0 ? (
          <div className="card bg-base-100 shadow-xl border border-secondary/20 p-20 text-center rounded-sm">
            <div className="flex justify-center mb-6">
              <IdentificationIcon className="h-16 w-16 opacity-10 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold opacity-50">No passports found</h2>
            <p className="mt-2 opacity-40 text-lg">
              You do not own any Machine Passports yet. Complete escrows to mint them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {passports.map(nft => {
              const blockExplorerBase = targetNetwork.blockExplorers?.default.url;
              const blockExplorerLink = blockExplorerBase
                ? `${blockExplorerBase}/address/${passportContractAddress}`
                : null;

              return (
                <div
                  key={nft.tokenId}
                  className="card bg-base-100 shadow-xl border-t-4 border-t-secondary rounded-sm overflow-hidden group hover:shadow-2xl transition-all"
                >
                  <div className="card-body p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-secondary/10 rounded-lg text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                        <ShieldCheckIcon className="h-8 w-8" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-black opacity-40 leading-none mb-1">Passport ID</p>
                        <p className="text-lg font-mono font-black">#00{nft.tokenId}</p>
                      </div>
                    </div>
                    <div className="relative aspect-video bg-base-300 rounded-lg overflow-hidden mb-4">
                      {nft.metadata?.image ? (
                        <img
                          src={nft.metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")}
                          alt={nft.metadata.name || "Machine"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/5 text-secondary/20">
                          <IdentificationIcon className="h-20 w-20" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-black mb-1 leading-tight">
                      {nft.metadata?.name || "Industrial Machine Asset"}
                    </h3>
                    <div className="badge badge-secondary badge-outline font-bold text-[10px] uppercase px-2 py-2 mb-4">
                      {nft.metadata?.attributes?.find((a: any) => a.trait_type === "Category")?.value ||
                        "Verified Proof-of-Specs"}
                    </div>

                    <div className="border-t border-base-200 pt-4 mt-2 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase opacity-40 mb-1">Specs:</span>
                          <span className="text-sm font-semibold truncate w-24">
                            {nft.metadata?.attributes?.find((a: any) => a.trait_type === "Item Name")?.value || "N/A"}
                          </span>
                        </div>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${nft.metadata?.properties?.po_cid || nft.uri}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm rounded-sm gap-2"
                        >
                          <DocumentMagnifyingGlassIcon className="h-4 w-4" /> View Specs
                        </a>
                      </div>

                      {blockExplorerLink && (
                        <a
                          href={blockExplorerLink}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-secondary btn-sm rounded-sm gap-2 w-full mt-2"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" /> View on Explorer
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MachinePassports;
