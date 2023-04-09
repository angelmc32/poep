import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";
import shallow from "zustand/shallow";
import ImgPlaceholder from "~~/components/product-nft/ImgPlaceholder";
import { AddressInput } from "~~/components/scaffold-eth";
import { useHasHydrated } from "~~/hooks/next-zustand/useHasHydrated";
import { useProjectFactoryWrite } from "~~/hooks/scaffold-eth/useProjectFactoryWrite";
import { useAppStore } from "~~/services/store/store";
import { getMetadataObject } from "~~/utils/web3";

const ExperienceUI = () => {
  const router = useRouter();
  const { experienceId } = router.query;
  const hasHydrated = useHasHydrated();
  const [nftCid, setNftCid] = useState<any>("");
  const [imgObject, setImgObject] = useState<any>(null);
  const [mintRecipientAddress, setMintRecipientAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attributesForm, setAttributesForm] = useState<Record<string, any>>({});
  const { currentImgName, directoriesCids, userContracts, storeAttributes, storeMetadata, userImgObjs } = useAppStore(
    state => ({
      currentImgName: state.currentImgName,
      directoriesCids: state.directoriesCids,
      storeAttributes: state.storeAttributes,
      storeContract: state.storeContract,
      storeMetadata: state.storeMetadata,
      userContracts: state.userContracts,
      userImgObjs: state.userImgObjs,
    }),
    shallow,
  );

  const { writeAsync, isLoading: isLoadingWriteTx } = useProjectFactoryWrite({
    contractAddress: userContracts[0]?.address,
    functionName: "safeMint",
    args: [mintRecipientAddress, nftCid],
  });

  useEffect(() => {
    if (hasHydrated) {
      console.log(userContracts);
      console.log(storeMetadata);
      console.log(userImgObjs[0]);
      console.log(directoriesCids);
      console.log(experienceId);

      console.log(userImgObjs[experienceId as any]);
      setImgObject(userImgObjs[experienceId as any]);
    }
    console.log("RENDER triggered");
  }, [directoriesCids, experienceId, hasHydrated, storeMetadata, userContracts, userImgObjs]);

  const previewImage = useMemo(() => {
    if (imgObject) {
      return URL.createObjectURL(new Blob([imgObject]));
    }
    return null;
  }, [imgObject]);

  const onMintHandler = async (event: any, index: number) => {
    event.preventDefault();

    const imgBlob = new Blob([userImgObjs[0]], { type: "image/jpeg" });
    console.log("Typeof imgBlob:", typeof imgBlob);
    console.log("imgBlob:", imgBlob);
    const metadata = getMetadataObject(storeMetadata[index], attributesForm);
    console.log(metadata);
    console.log(directoriesCids[index]);
    const body = {
      metadata: metadata,
      imgCid: directoriesCids[index],
      imgName: currentImgName,
    };

    try {
      const res = await axios.post("/api/upload-metadata", body, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(res.data.cid);
      setNftCid(res.data.cid);
      const evmRes = await writeAsync();
      console.log(evmRes);
    } catch (error: any) {
      if (error.body) {
        const parsedBody = JSON.parse(error.body);
        const { message } = parsedBody.error;
        toast.error(message, {
          position: "bottom-right",
        });
      } else {
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col py-8 px-4 lg:px-8 lg:py-12 justify-center items-center min-h-full">
      <h1 className="text-4xl font-semibold text-center mb-4">
        {experienceId ? userContracts[experienceId as any].name : " Name"}
        <br className="md:hidden" /> <span className="text-2xl">Experience NFT</span>
      </h1>
      <div className="w-full flex flex-col items-center justify-center px-2 lg:px-0 py-4 lg:py-8">
        <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary rounded-xl w-full md:w-4/5 lg:w-3/5 xl:w-1/2 px-6 md:px-16 py-4 md:py-8">
          <h5 className="mb-2 text-lg font-medium text-left px-1">
            Collection {experienceId ? userContracts[experienceId as any].name : " Name"}
          </h5>
          <h6 className="mb-2 ml-2 text-sm text-left px-1">Owned by 0x12...A1B2</h6>
          <div className="w-full flex justify-center">
            {experienceId && (
              <ImgPlaceholder
                chain={experienceId && userContracts[experienceId as any].chain}
                previewImage={previewImage}
                ipfsCid={experienceId && directoriesCids[experienceId as any]}
              />
            )}
          </div>
          <div tabIndex={0} className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-lg my-6">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium">Description</div>
            <div className="collapse-content">
              <p>{experienceId ? storeMetadata[experienceId as any].description_string_1 : "No description entered"}</p>
            </div>
          </div>
          <div tabIndex={0} className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-lg my-6">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium">Attributes</div>
            <div className="collapse-content grid grid-cols-2 gap-2 md:grid-cols-3">
              {experienceId && hasHydrated ? (
                storeAttributes[experienceId as any].map((attribute: any, index: number) => (
                  <div
                    key={`${attribute}_${index}`}
                    className="border border-base-300 bg-accent rounded-lg my-2 py-4 px-2 text-center"
                  >
                    <p className="text-md font-semibold">{attribute}</p>
                    <p className="text-lg font-bold">Some Value</p>
                    <p className="text-md">Rarity: XX %</p>
                  </div>
                ))
              ) : (
                <p>No attributes entered</p>
              )}
            </div>
          </div>
          <div className="w-full flex items-center justify-center mb-4">
            <label
              htmlFor="mint-modal"
              className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md w-3/5 md:w-3/5 lg:w-2/5"
            >
              Mint <span className="ml-2">⛏️</span>
            </label>
            <input type="checkbox" id="mint-modal" className="modal-toggle" />
            <div className="modal">
              <div className="modal-box relative">
                <label htmlFor="mint-modal" className="btn btn-sm btn-circle absolute right-2 top-2">
                  ✕
                </label>
                <h2 className="mt-12 mb-8 text-2xl font-medium text-center">Mint NFT and transfer to:</h2>
                <div className="mb-8 px-4">
                  <AddressInput
                    name="mintRecipientAddress"
                    onChange={(value: any) => setMintRecipientAddress(value)}
                    placeholder="Enter address or ENS"
                    value={mintRecipientAddress}
                  />
                </div>
                <div className="m-2">
                  <h3 className="mb-2 text-xl font-medium text-center">NFT Attributes</h3>
                  {experienceId &&
                    hasHydrated &&
                    storeAttributes[experienceId as any].map((attribute: any) => (
                      <div key={`${attribute}_${experienceId as any}`} className="w-full">
                        <label className="ml-4 mb-4">{attribute}</label>
                        <div className="flex border-2 border-base-300 bg-base-200 rounded-lg text-accent">
                          <input
                            className="input input-ghost focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                            placeholder=""
                            name={attribute}
                            value={attributesForm[attribute] || ""}
                            onChange={(event: any) =>
                              setAttributesForm(prevState => ({ ...prevState, [attribute]: event.target.value }))
                            }
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ))}
                  <div className="w-full flex justify-center mt-8 mb-8">
                    <button
                      className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md w-3/5 md:w-3/5 lg:w-2/5"
                      disabled={isLoading || isLoadingWriteTx}
                      onClick={(event: any) => onMintHandler(event, experienceId as any)}
                    >
                      Mint <span className="ml-2">⛏️</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-center mb-4">
            <label
              htmlFor="transfer-modal"
              className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md w-3/5 md:w-3/5 lg:w-2/5"
            >
              Transfer <span className="ml-2">➡️</span>
            </label>
            <input type="checkbox" id="transfer-modal" className="modal-toggle" />
            <div className="modal">
              <div className="modal-box relative">
                <label htmlFor="transfer-modal" className="btn btn-sm btn-circle absolute right-2 top-2">
                  ✕
                </label>
                <h2 className="mt-12 mb-8 text-2xl font-medium text-center">Transfer NFT to:</h2>
                <div className="mb-8 px-4">
                  <AddressInput
                    name="mintRecipientAddress"
                    onChange={(value: any) => setMintRecipientAddress(value)}
                    placeholder="Enter address or ENS"
                    value={mintRecipientAddress}
                  />
                </div>
                <div className="w-full flex justify-center mt-8 mb-8">
                  <button
                    className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md w-3/5 md:w-3/5 lg:w-2/5"
                    disabled={isLoading || isLoadingWriteTx}
                    onClick={(event: any) => onMintHandler(event, experienceId as any)}
                  >
                    Transfer <span className="ml-2">➡️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full flex items-center justify-center mb-4">
            <label
              htmlFor="balanceOf-modal"
              className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md  w-3/5 md:w-3/5 lg:w-2/5"
            >
              Balance of <span className="ml-2">⚖️</span>
            </label>
            <input type="checkbox" id="balanceOf-modal" className="modal-toggle" />
            <div className="modal">
              <div className="modal-box relative">
                <label htmlFor="balanceOf-modal" className="btn btn-sm btn-circle absolute right-2 top-2">
                  ✕
                </label>
                <h2 className="mt-12 mb-8 text-2xl font-medium text-center">Balance Of:</h2>
                <div className="mb-8 px-4">
                  <AddressInput
                    name="mintRecipientAddress"
                    onChange={(value: any) => setMintRecipientAddress(value)}
                    placeholder="Enter address or ENS"
                    value={mintRecipientAddress}
                  />
                </div>
                <div className="w-full flex justify-center mt-8 mb-8">
                  <button
                    className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md w-3/5 md:w-3/5 lg:w-2/5"
                    disabled={isLoading || isLoadingWriteTx}
                    onClick={(event: any) => onMintHandler(event, experienceId as any)}
                  >
                    Transfer <span className="ml-2">➡️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full flex items-center justify-center mb-4">
            <label
              htmlFor="ownerOf-modal"
              className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md  w-3/5 md:w-3/5 lg:w-2/5"
            >
              Owner of<span className="ml-2">🥸</span>
            </label>
            <input type="checkbox" id="ownerOf-modal" className="modal-toggle" />
            <div className="modal">
              <div className="modal-box relative">
                <label htmlFor="ownerOf-modal" className="btn btn-sm btn-circle absolute right-2 top-2">
                  ✕
                </label>
                <h2 className="mt-12 mb-8 text-2xl font-medium text-center">Owner Of:</h2>
                <div className="mb-8 px-4">
                  <AddressInput
                    name="mintRecipientAddress"
                    onChange={(value: any) => setMintRecipientAddress(value)}
                    placeholder="Enter address or ENS"
                    value={mintRecipientAddress}
                  />
                </div>
                <div className="w-full flex justify-center mt-8 mb-8">
                  <button
                    className="btn bg-orange-700 hover:bg-orange-600 border-primary-focus border-2 text-gray-900 dark:text-white btn-md w-3/5 md:w-3/5 lg:w-2/5"
                    disabled={isLoading || isLoadingWriteTx}
                    onClick={(event: any) => onMintHandler(event, experienceId as any)}
                  >
                    Transfer <span className="ml-2">➡️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceUI;
