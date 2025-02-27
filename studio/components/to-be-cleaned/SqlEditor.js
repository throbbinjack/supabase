import Editor, { useMonaco } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { Typography } from '@supabase/ui'
import { useStore } from 'hooks'

const SqlEditor = ({
  queryId,
  language = 'pgsql',
  defaultValue = '',
  readOnly = false,
  contextmenu = true,
  onInputChange = () => {},
}) => {
  const monaco = useMonaco()
  const { meta } = useStore()
  const editorRef = useRef()

  useEffect(() => {
    if (monaco) {
      // Supabase theming (Can't seem to get it to work for now)
      monaco.editor.defineTheme('supabase', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: '', background: '4a5568' },
          { token: 'string.sql', foreground: '24b47e' },
          { token: 'comment', foreground: '666666' },
          { token: 'predefined.sql', foreground: 'D4D4D4' },
        ],
      })

      // Enable pgsql format
      const formatprovider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model) {
          const value = model.getValue()
          const formatted = await formatPgsql(value)
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ]
        },
      })

      return () => {
        formatprovider.dispose()
      }
    }
  }, [monaco])

  useEffect(() => {
    if (editorRef.current) {
      // add margin above first line
      editorRef.current?.changeViewZones((accessor) => {
        accessor.addZone({
          afterLineNumber: 0,
          heightInPx: 4,
          domNode: document.createElement('div'),
        })
      })
    }
  }, [queryId])

  async function formatPgsql(value) {
    try {
      const formatted = await meta.formatQuery(value)
      if (formatted.error) throw formatted.error
      return formatted
    } catch (error) {
      console.error('formatPgsql error:', error)
      return value
    }
  }

  const onMount = (editor, monaco) => {
    editorRef.current = editor

    // Add margin above first line
    editor.changeViewZones((accessor) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })
  }

  const Loading = () => <Typography.Title level={4}>Loading</Typography.Title>

  return (
    <Editor
      className="monaco-editor"
      theme="vs-dark"
      defaultLanguage={language}
      defaultValue={defaultValue}
      path={queryId}
      loading={<Loading />}
      options={{
        readOnly,
        tabSize: 2,
        fontSize: 13,
        minimap: {
          enabled: false,
        },
        wordWrap: 'on',
        fixedOverflowWidgets: true,
        contextmenu: contextmenu,
      }}
      onMount={onMount}
      onChange={onInputChange}
    />
  )
}

export default SqlEditor
