import { Player } from "@remotion/player";
import type { NextPage } from "next";
import Head from "next/head";
import React from "react";
import  VideoGenerator  from "../components/VideoGenerator";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>AI Video Generator</title>
        <meta name="description" content="Generate videos using AI" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <VideoGenerator />
    </div>
  );
};

export default Home;