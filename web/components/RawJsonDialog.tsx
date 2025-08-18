'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'

export function RawJsonDialog({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false)
  const json = data ? JSON.stringify(data, null, 2) : '{}'
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="px-3 py-2 rounded-md border text-sm">Raw JSON</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white dark:bg-zinc-900 p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="font-medium">Server Response</Dialog.Title>
            <Dialog.Close className="px-2 py-1 rounded border text-sm">Close</Dialog.Close>
          </div>
          <pre className="max-h-[60vh] overflow-auto text-xs whitespace-pre">
{json}
          </pre>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
