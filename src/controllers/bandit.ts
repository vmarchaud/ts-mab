import express from 'express'
import { Path, Controller, Get, Route, Request, Response, Put, Body, Query, Post } from 'tsoa'
import { SerializedBandit } from '../bandits/types'
import httpErrors from 'http-errors'
import { PickArmsBanditResult } from '../bandits/manager'

type CreateBody = {
  arms: string[],
  scope: string
}

type UpdateBody = {
  arms: string[]
}

@Route('/bandits')
export class BanditController extends Controller {

  @Get('{id}')
  @Response(404)
  @Response(200)
  public async get (
    @Request() req: express.Request,
    @Path('id') id: string
  ): Promise<SerializedBandit> {
    const bandit = await req.manager.get(id)
    if (bandit === undefined) {
      throw new httpErrors.NotFound()
    }
    return bandit.toString()
  }

  @Get('{id}/pick/{pickId}')
  @Response(404)
  @Response(200)
  public async pick (
    @Request() req: express.Request,
    @Path('id') id: string,
    @Path('pickId') pickId: string,
    @Query('count') count?: string
  ): Promise<PickArmsBanditResult> {
    return req.manager.pick({
      identifier: id,
      armsCount: count !== undefined ? parseInt(count, 10) : 1,
      pickId
    })
  }

  @Get('{id}/reward/{arm}')
  @Response(404)
  @Response(200)
  public async reward (
    @Request() req: express.Request,
    @Path('id') id: string,
    @Path('arm') arm: string,
    @Query('pickId') pickId?: string
  ): Promise<void> {
    return req.manager.reward({
      identifier: id,
      arm,
      pickId
    })
  }

  @Put('{id}')
  @Response(409)
  @Response(200)
  public async create (
    @Request() req: express.Request,
    @Path('id') id: string,
    @Body() body: CreateBody
  ): Promise<SerializedBandit> {
    const bandit = await req.manager.create(Object.assign({ identifier: id }, body))
    return bandit.toString()
  }

  @Post('{id}')
  @Response(404)
  @Response(200)
  public async update (
    @Request() req: express.Request,
    @Path('id') id: string,
    @Body() body: UpdateBody
  ): Promise<void> {
    return req.manager.update({
      identifier: id,
      arms: body.arms
    })
  }
}
