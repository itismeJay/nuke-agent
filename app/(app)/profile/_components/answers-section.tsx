"use client"

import { PlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteApplicationAnswer,
  saveApplicationAnswer,
} from "@/lib/profile/actions"
import type { ApplicationAnswerRow } from "@/lib/profile/queries"

import { ANSWER_CATEGORIES } from "./format"
import { DeleteButton, Labeled, NativeSelect, RecordDialog } from "./form-kit"
import { EmptyHint, RecordRow, SectionCard } from "./section-card"

const categoryLabel = (value: string) =>
  ANSWER_CATEGORIES.find((c) => c.value === value)?.label ?? value

function AnswerFields({
  answer,
  fieldErrors,
}: {
  answer?: ApplicationAnswerRow
  fieldErrors?: Record<string, string>
}) {
  return (
    <>
      {answer ? <input type="hidden" name="id" value={answer.id} /> : null}
      <Labeled label="Question" htmlFor="question" error={fieldErrors?.question}>
        <Input
          id="question"
          name="question"
          defaultValue={answer?.question ?? ""}
          placeholder="Are you authorized to work in the US?"
          required
        />
      </Labeled>
      <Labeled label="Your answer" htmlFor="answer" error={fieldErrors?.answer}>
        <Textarea id="answer" name="answer" rows={3} defaultValue={answer?.answer ?? ""} />
      </Labeled>
      <Labeled label="Category" htmlFor="category">
        <NativeSelect
          id="category"
          name="category"
          defaultValue={answer?.category ?? "general"}
        >
          {ANSWER_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </NativeSelect>
      </Labeled>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_sensitive"
          defaultChecked={answer?.is_sensitive ?? false}
          className="size-4"
        />
        Sensitive — always review before it&apos;s used on an application
      </label>
    </>
  )
}

export function AnswersSection({
  answers,
}: {
  answers: ApplicationAnswerRow[]
}) {
  return (
    <SectionCard
      id="answers"
      title="Application answers"
      description="Reusable answers to questions that come up on applications. Nook never submits these automatically — sensitive ones are always shown to you first."
      action={
        <RecordDialog
          title="Add answer"
          triggerLabel={
            <>
              <PlusIcon className="size-4" /> Add
            </>
          }
          action={saveApplicationAnswer}
        >
          {({ state }) => <AnswerFields fieldErrors={state.fieldErrors} />}
        </RecordDialog>
      }
    >
      {answers.length === 0 ? (
        <EmptyHint>No saved answers yet.</EmptyHint>
      ) : (
        <div>
          {answers.map((row) => (
            <RecordRow
              key={row.id}
              title={row.question}
              meta={
                <span className="inline-flex items-center gap-1.5">
                  {categoryLabel(row.category)}
                  {row.is_sensitive ? (
                    <Badge variant="outline" className="font-normal text-amber-600 dark:text-amber-500">
                      Sensitive
                    </Badge>
                  ) : null}
                </span>
              }
              actions={
                <RecordDialog
                  title="Edit answer"
                  triggerLabel="Edit"
                  triggerVariant="ghost"
                  action={saveApplicationAnswer}
                  onDelete={
                    <DeleteButton action={deleteApplicationAnswer} id={row.id} />
                  }
                >
                  {({ state }) => (
                    <AnswerFields answer={row} fieldErrors={state.fieldErrors} />
                  )}
                </RecordDialog>
              }
            >
              {row.answer ? (
                <p className="text-sm text-muted-foreground">{row.answer}</p>
              ) : null}
            </RecordRow>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
