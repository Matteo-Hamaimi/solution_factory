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
  >([
    {
      type: "machine",
      message: "Bonjour, je suis Alyz, votre assistant virtuel",
    },
  ]);
  const [productInfo] = useState<{
    satisfaction: number;
    positive: string[];
    negative: string[];
  }>({
    satisfaction: 79,
    positive: ["Bien situé"],
    negative: ["Pas bien"],
  });

  const domain = useMemo(() => {
    let urlObject;
    try {
      urlObject = new URL(url);
    } catch (e) {
      return false;
    }
    urlObject = urlObject.hostname.split(".");
    urlObject = urlObject[urlObject.length - 2];
    urlObject = urlObject.charAt(0).toUpperCase() + urlObject.slice(1);

    return urlObject;
  }, [url]);

  const getDoc = async () => {
    return chrome.tabs
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
      });
  };

  const getUrl = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0].url;
  };

  const sendMessage = async () => {
    if (!input.length) return;
    setMessages((messages) => [...messages, { type: "user", message: input }]);
    setInput("");
    console.log(input, comments);
    const response = await fetch(import.meta.env.VITE_API_URL + "/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: input, context: [doc?.getElementById("feature-bullets")?.textContent,...comments ] }),
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
      setDoc((await getDoc()) as Document);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const messageList = document.getElementById("messageList");
    messageList?.scrollTo(0, messageList.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (!doc) return;
    switch (domain) {
      case "Amazon":
        setImageUrl(
          doc?.getElementById("landingImage")?.getAttribute("src") as string
        );
        console.log(doc?.getElementById("productTitle")?.innerText as string);
        setMessages([
          {
            type: "machine",
            message: "Je vois que vous êtes sur Amazon, sur le produit : ",
          },
          {
            type: "machine",
            message: doc?.getElementById("productTitle")?.innerText as string,
          },
          { type: "machine", message: "Je peux vous aider ?" },
        ]);

        setComments(Array.prototype.slice
          .call(doc?.getElementsByClassName("review-text"))
          ?.map((e) => e.innerText))

        break;
    }
  }, [domain, doc, urlImage]);

  if (!["Amazon", "Airbnb", "Tripadvisor"].includes(domain as string)) {
    return <div className="text-xl p-4">{domain} not supported</div>;
  }

  return (
    <div className="w-[34rem] h-96 flex flex-col gap-2 bg-slate-900">
      <div className="h-full w-full grid grid-cols-3 p-2 justify-center items-center gap-2 text-sm">
        <div className="bg-white rounded-md flex flex-col items-center justify-center col-span-2 h-64 p-2">
          <div className="grow flex w-full gap-2 text-white">
            <div className="flex flex-col gap-2 grow">
              <div className="flex gap-2 items-center border-b text-black p-2 pt-0">
                <img src={logo} className="h-6 w-6" />
                <div className="w-full  font-bold">Alyz</div>
              </div>

              <div
                className="flex flex-col gap-2 overflow-scroll h-40 no-scrollbar"
                id="messageList"
              >
                {messages.map((message) => (
                  <div
                    className={`max-w-[66%] px-4 py-1 rounded-2xl ${
                      message.type === "machine"
                        ? "bg-blue-500 self-start"
                        : "bg-gray-400 self-end"
                    }`}
                  >
                    {message.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <input
              type="text"
              className="rounded-full border grow focus:outline-none px-2"
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
              className="bg-blue-500 rounded-full stroke-white p-2 shadow"
              onClick={sendMessage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
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

        <div className="bg-white rounded-md h-64 overflow-hidden flex justify-center items-center">
          <img src={urlImage} className="object-cover h-full" />
        </div>
        <div className="bg-white rounded-md flex p-4 gap-4 justify-around col-span-2 text-xs h-full">
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 stroke-green-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
              />
            </svg>

            <ul className="list-inside list-disc marker:text-green-500">
              {productInfo.positive.map((message) => (
                <li>{message}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 stroke-red-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384"
              />
            </svg>

            <ul className="list-inside list-disc marker:text-red-500">
              {productInfo.negative.map((message) => (
                <li>{message}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white rounded-md flex items-center justify-center gap-2 p-2 h-full">
          <div
            className="rounded-full h-12 w-12 flex justify-center items-center"
            style={{
              background: `radial-gradient(closest-side, white 79%, transparent 80% 100%),conic-gradient(${
                productInfo.satisfaction > 50
                  ? "rgb(34 197 94)"
                  : "rgb(239 68 68)"
              } ${productInfo.satisfaction}%, rgb(243 244 246) 0)`,
            }}
          >
            {productInfo.satisfaction}%
          </div>
          <div className="text-sm">de satisfaction</div>
        </div>
      </div>
    </div>
  );
}
