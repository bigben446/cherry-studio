import ContextMenu from '@renderer/components/ContextMenu'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useModel } from '@renderer/hooks/useModel'
import { useMessageStyle, useSettings } from '@renderer/hooks/useSettings'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { getMessageModelId } from '@renderer/services/MessagesService'
import { getModelUniqId } from '@renderer/services/ModelService'
import { Assistant, Topic } from '@renderer/types'
import type { Message } from '@renderer/types/newMessage'
import { classNames } from '@renderer/utils'
import { Divider } from 'antd'
import React, { Dispatch, FC, memo, SetStateAction, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import MessageContent from './MessageContent'
import MessageErrorBoundary from './MessageErrorBoundary'
import MessageHeader from './MessageHeader'
import MessageMenubar from './MessageMenubar'
import MessageTokens from './MessageTokens'

interface Props {
  message: Message
  topic: Topic
  assistant?: Assistant
  index?: number
  total?: number
  hidePresetMessages?: boolean
  style?: React.CSSProperties
  isGrouped?: boolean
  isStreaming?: boolean
  onSetMessages?: Dispatch<SetStateAction<Message[]>>
}

const MessageItem: FC<Props> = ({
  message,
  topic,
  // assistant,
  index,
  hidePresetMessages,
  isGrouped,
  isStreaming = false,
  style
}) => {
  const { t } = useTranslation()
  const { assistant, setModel } = useAssistant(message.assistantId)
  const model = useModel(getMessageModelId(message), message.model?.provider) || message.model
  const { isBubbleStyle } = useMessageStyle()
  const { showMessageDivider, messageFont, fontSize } = useSettings()
  const messageContainerRef = useRef<HTMLDivElement>(null)

  const isLastMessage = index === 0
  const isAssistantMessage = message.role === 'assistant'
  const showMenubar = !isStreaming && !message.status.includes('ing')

  const messageBorder = showMessageDivider ? undefined : 'none'
  const messageBackground = getMessageBackground(isBubbleStyle, isAssistantMessage)

  const messageHighlightHandler = useCallback((highlight: boolean = true) => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollIntoView({ behavior: 'smooth' })
      if (highlight) {
        setTimeout(() => {
          const classList = messageContainerRef.current?.classList
          classList?.add('message-highlight')
          setTimeout(() => classList?.remove('message-highlight'), 2500)
        }, 500)
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribes = [EventEmitter.on(EVENT_NAMES.LOCATE_MESSAGE + ':' + message.id, messageHighlightHandler)]
    return () => unsubscribes.forEach((unsub) => unsub())
  }, [message.id, messageHighlightHandler])

  if (hidePresetMessages && message.isPreset) {
    return null
  }

  if (message.type === 'clear') {
    return (
      <NewContextMessage onClick={() => EventEmitter.emit(EVENT_NAMES.NEW_CONTEXT)}>
        <Divider dashed style={{ padding: '0 20px' }} plain>
          {t('chat.message.new.context')}
        </Divider>
      </NewContextMessage>
    )
  }

  return (
    <MessageContainer
      key={message.id}
      className={classNames({
        message: true,
        'message-assistant': isAssistantMessage,
        'message-user': !isAssistantMessage
      })}
      ref={messageContainerRef}
      style={{ ...style, alignItems: isBubbleStyle ? (isAssistantMessage ? 'start' : 'end') : undefined }}>
      <ContextMenu>
        <MessageHeader message={message} assistant={assistant} model={model} key={getModelUniqId(model)} />
        <MessageContentContainer
          className={
            message.role === 'user'
              ? 'message-content-container message-content-container-user'
              : message.role === 'assistant'
                ? 'message-content-container message-content-container-assistant'
                : 'message-content-container'
          }
          style={{
            fontFamily: messageFont === 'serif' ? 'var(--font-family-serif)' : 'var(--font-family)',
            fontSize,
            background: messageBackground,
            overflowY: 'visible'
          }}>
          <MessageErrorBoundary>
            <MessageContent message={message} />
          </MessageErrorBoundary>
          {showMenubar && (
            <MessageFooter
              className="MessageFooter"
              style={{
                border: messageBorder,
                flexDirection: isLastMessage || isBubbleStyle ? 'row-reverse' : undefined
              }}>
              <MessageTokens message={message} isLastMessage={isLastMessage} />
              <MessageMenubar
                message={message}
                assistant={assistant}
                model={model}
                index={index}
                topic={topic}
                isLastMessage={isLastMessage}
                isAssistantMessage={isAssistantMessage}
                isGrouped={isGrouped}
                messageContainerRef={messageContainerRef as React.RefObject<HTMLDivElement>}
                setModel={setModel}
              />
            </MessageFooter>
          )}
        </MessageContentContainer>
      </ContextMenu>
    </MessageContainer>
  )
}

const getMessageBackground = (isBubbleStyle: boolean, isAssistantMessage: boolean) => {
  return isBubbleStyle
    ? isAssistantMessage
      ? 'var(--chat-background-assistant)'
      : 'var(--chat-background-user)'
    : undefined
}

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background-color 0.3s ease;
  padding: 0 20px;
  transform: translateZ(0);
  will-change: transform;
  &.message-highlight {
    background-color: var(--color-primary-mute);
  }
  .menubar {
    opacity: 0;
    transition: opacity 0.2s ease;
    transform: translateZ(0);
    will-change: opacity;
    &.show {
      opacity: 1;
    }
  }
  &:hover {
    .menubar {
      opacity: 1;
    }
  }
`

const MessageContentContainer = styled.div`
  max-width: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 46px;
  margin-top: 5px;
  overflow-y: auto;
`

const MessageFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  margin-top: 2px;
  border-top: 1px dotted var(--color-border);
  gap: 20px;
`

const NewContextMessage = styled.div`
  cursor: pointer;
`

export default memo(MessageItem)
