/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import logo from "./assets/logo.png";

export default function Alyz() {
  const [comments, setComments] = useState<string[]>([]);
  const [url, setUrl] = useState<string>("");
  const [doc, setDoc] = useState<Document>();
  const [input, setInput] = useState<string>("");
  const [urlImage, setImageUrl] = useState<string>("");
  const [messages, setMessages] = useState<
    { type: "user" | "machine"; message: string }[]
  >([])
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [productInfo, setProductInfo] = useState<{
    score: number;
    summary: string[][];
  }>();

  const domain = useMemo(() => {
    let urlObject;
    try {
      urlObject = new URL(url);
    } catch (e) {
      return false;
    }
    urlObject = urlObject.hostname;
    urlObject = urlObject.split(".").slice(0, 3).join(".");
    console.log(urlObject);
    return urlObject as string;
  }, [url]);

  const getDoc = async () => {
    setDoc((await chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const activeTab = tabs[0];
        const activeTabId = activeTab.id;

        console.log(activeTab.url);

        return chrome.scripting.executeScript({
          target: { tabId: activeTabId as number },
          func: () => document.querySelector("body")?.innerHTML,
        });
      })
      .then(function (results) {
        return new DOMParser().parseFromString(
          results[0].result as string,
          "text/html"
        );
      })
      .catch(function (error) {
        console.log(error);
      })) as Document)
  };

  const getUrl = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0].url;
  };

  const getProductInfo = async () => {
    const response = await fetch(import.meta.env.VITE_API_URL + "/alyz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comments,
      }),
    });

    const data = await response.json();
    setProductInfo(data);
  };

  const sendMessage = async () => {
    if (!input.length || messages[messages.length - 1]?.type === "user") return;

    setMessages((messages) => [...messages, { type: "user", message: input }]);
    setInput("");
    console.log(input, description);
    const response = await fetch(import.meta.env.VITE_API_URL + "/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: input,
        context: description,
      }),
    });

    const data = await response.json();

    setMessages((messages) => [
      ...messages,
      { type: "machine", message: data.answer },
    ]);
  };

  useEffect(() => {
    const fetchData = async () => {
      setUrl((await getUrl()) as string);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!url) return;
    getDoc()
  }, [url]);

  useEffect(() => {
    console.log(comments);
    console.log(description)
    console.log(urlImage)
    if(comments.length) getProductInfo();
  }, [comments]);

  useEffect(() => {
    if (!messages.length) return;
    const messageList = document.getElementById("messageList");
    messageList?.scrollTo(0, messageList.scrollHeight);
  }, [messages]);



  useEffect(() => {
    if (!doc) return;
    switch (domain) {
      case "www.amazon.com":
        setPrice(
          doc?.getElementById("corePrice_feature_div")?.textContent as string
        )
        setImageUrl(
          doc?.getElementById("landingImage")?.getAttribute("src") as string
        );
        setMessages([
          {
            type: "machine",
            message: "I see that your are on Amazon on the product page :",
          },
          {
            type: "machine",
            message: doc
              ?.getElementById("productTitle")
              ?.innerText.slice(0, 80) as string,
          },
          { type: "machine", message: "Can I help you ?" },
        ]);

        setComments(
          Array.prototype.slice
            .call(doc?.getElementsByClassName("review-text"))
            ?.map((e) => e.innerText)
        );

        setDescription(
          doc.querySelector('div#productOverview_feature_div div.a-section.a-spacing-small.a-spacing-top-small')?.textContent as string +
          doc.getElementById("feature-bullets")?.textContent as string
        );

        break;
      case "www.airbnb.fr":
        setImageUrl(
          doc?.getElementById("FMP-target")?.getAttribute("src") as string
        );

        setMessages([
          {
            type: "machine",
            message: "I see that your are on Airbnb on the product page :",
          },
          {
            type: "machine",
            message: doc?.querySelector("h1.hpipapi.i1pmzyw7")?.textContent as string,
          },
          { type: "machine", message: "Can I help you ?" },

        ]);

        setComments(
          Array.prototype.slice
            .call(doc.querySelectorAll('._162hp8xh .ll4r2nl.dir.dir-ltr'))
            ?.map((e) => e.innerText)
        );

        setDescription(
          doc?.querySelector(".d1isfkwk .ll4r2nl.dir.dir-ltr")?.textContent as string
        );

        break;
      case "www.tripadvisor.com":
        setImageUrl(
          doc?.querySelector(".NhWcC._R.mdkdE > img")?.getAttribute("src") as string
        );

        setMessages([
          {

            type: "machine",
            message: "I see that your are on Tripadvisor on the product page :",
          },
          {
            type: "machine",
            message: doc?.querySelector(".biGQs._P.rRtyp")?.textContent as string,
          },
          { type: "machine", message: "Can I help you ?" },

        ]);

        setComments(
          Array.prototype.slice
            .call(doc.querySelectorAll('.vTVDc'))
            ?.map((e) => e.innerText)
        );
        console.log(comments)
          
        setDescription(
          doc?.querySelector(".cPQsENeY")?.textContent as string
        );
          
        break;
    }
  }, [doc]);

  if (!["www.amazon.com", 'www.airbnb.fr', "www.tripadvisor.com"].includes(domain as string)) {
    return <div className="text-xl p-4">{domain} not supported</div>;
  }

  if (!productInfo)
    return (
      <>
      <div className="bg-violet-600 font-bold text-white text-xl justify-center items-center p-4 flex gap-2">
        Loading...
        
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="w-6 h-6 animate-spin"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </div>
      </>
    );

  return (
    <div className="h-[26rem] w-[34rem] bg-gray-100 p-2 flex flex-col gap-2">
      <div className="flex gap-2 justify-center items-center w-full">
        <img src={logo} className="h-6 w-6" />
        <div className="font-belanosima text-2xl text-violet-600">Alyz</div>
      </div>
      <div className="flex flex-col gap-2 grow">
        <div className="flex gap-2 w-full h-2/3">
          <div className="bg-white shadow flex flex-col rounded-lg gap-2 p-2 w-2/3 h-full">
            <div
              className="flex flex-col gap-2 overflow-scroll no-scrollbar h-0 grow"
              id="messageList"
            >
              {messages.map((message) => (
                <div
                  className={`max-w-[66%] px-4 py-1 rounded-2xl break-words text-white ${
                    message.type === "machine"
                      ? "bg-blue-500 self-start"
                      : "bg-gray-400 self-end"
                  }`}
                >
                  {message.message}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                disabled={messages[messages.length - 1]?.type === "user"}
                type="text"
                className="rounded-full border focus:outline-none p-2 grow"
                placeholder="Posez votre question"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />
              <div
                className="bg-blue-500 rounded-full stroke-white shadow flex justify-center items-center aspect-square h-full"
                onClick={sendMessage}
              >
                <svg
                  xmlns="http:www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 stroke-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="grow h-full bg-white shadow rounded-lg overflow-hidden max-w-[30%] relative">
            <img src={urlImage} className="object-cover w-full h-full" />
            <div className="bg-white rounded-full text-xs top-2 left-2 shadow-md border absolute z-10">
                {price}
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full grow">
          <div className="bg-white shadow flex flex-col gap-2 rounded-lg p-2 w-2/3 h-full">
            <div className="font-bold text-base">Reviews</div>
            <div className="flex gap-2 grow flex-wrap">
              {productInfo.summary[1].map((message) => (
                <div className="px-2 py-1 rounded-full bg-green-200 text-green-600 h-min">
                  {message}
                </div>
              ))}
              {productInfo.summary[0].map((message) => (
                <div className="px-2 py-1 rounded-full bg-red-200 text-red-600 h-min">
                  {message}
                </div>
              ))}
            </div>
          </div>
          <div className="shadow flex flex-col justify-center gap-2 rounded-lg p-2 h-full bg-violet-500 text-white grow">
            <div>
              <span className="text-3xl font-bold">
                {Math.round(productInfo.score*100)}
              </span>
              %
            </div>
            <div>of satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
}
