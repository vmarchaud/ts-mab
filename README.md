# Multi Armed Bandit

Wanted to test a typescript implementation and specially easily scaling it. The service in itself is stateless and push consistency the datastore, which is redis.

I used the thompson-sampling implementation from [this repository](https://github.com/alextanhongpin/node-bandit) because i'm no math expert but other implemtation can be easily added (see `src/bandits/impls/`).


# API

The service expose a simple API that expose the MAB logic so you can built on it, here are the endpoints:

Method | HTTP request | Description
------------- | ------------- | -------------
[**create**](#create) | **PUT** /bandits/{id} | 
[**get**](#get) | **GET** /bandits/{id} | 
[**pick**](#pick) | **GET** /bandits/{id}/pick/{pickId} | 
[**reward**](reward) | **GET** /bandits/{id}/reward/{arm} | 
[**update**](#update) | **POST** /bandits/{id} | 

All URIs are relative to *http://localhost/api*