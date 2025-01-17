import { Version } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react'

interface SVGDisplayProps {
  currentVersion: number
  versions: Version[]
  onVersionChange: (index: number) => void
  isLoading: boolean
}

export function SVGDisplay({
  currentVersion,
  versions,
  onVersionChange,
  isLoading,
}: SVGDisplayProps) {
  const currentSVG = versions[currentVersion]?.svg

  const handleDownload = () => {
    if (!currentSVG) return
    
    const blob = new Blob([currentSVG], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `svg-${currentVersion + 1}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 relative">
        {versions.length > 0 && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-background/80 backdrop-blur-sm rounded-lg shadow p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onVersionChange(currentVersion - 1)}
              disabled={currentVersion <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentVersion + 1} / {versions.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onVersionChange(currentVersion + 1)}
              disabled={currentVersion >= versions.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={!currentSVG}
              title="Download SVG"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="h-full flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Generating SVG...</span>
            </div>
          ) : currentSVG ? (
            <div
              dangerouslySetInnerHTML={{ __html: currentSVG }}
              className="max-w-full max-h-full p-8"
            />
          ) : (
            <div className="text-muted-foreground">
              Describe what graphic you&apos;d like to create...
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:flex p-4 items-center justify-center gap-4 border-t bg-background/50 backdrop-blur-sm">
        <a 
          href="https://www.kamiwaza.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[rgb(65,138,105)] hover:underline"
        >
          Powered by Kamiwaza
        </a>
      </div>
    </div>
  )
}
