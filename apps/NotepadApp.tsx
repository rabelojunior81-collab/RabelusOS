
import React, { useState, useRef, useEffect } from 'react';
import { 
    Save, FolderOpen, Type, Search, Settings, 
    ChevronRight, ZoomIn, ZoomOut, FileText, 
    Check, X, Copy, Scissors, Clipboard, RotateCcw, RotateCw
} from 'lucide-react';

// --- TYPES ---
interface FontConfig {
    family: 'sans' | 'mono' | 'serif';
    size: number;
    weight: 'normal' | 'bold';
}

interface MenuDropdownProps {
    label: string;
    isOpen: boolean;
    onClick: () => void;
    onClose: () => void;
    children: React.ReactNode;
}

// --- SUB-COMPONENTS ---
const MenuDropdown: React.FC<MenuDropdownProps> = ({ label, isOpen, onClick, onClose, children }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={onClick}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${isOpen ? 'bg-glass-accent text-black font-bold' : 'text-glass-text hover:bg-white/10'}`}
            >
                {label}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#050508]/95 border border-glass-border shadow-2xl rounded-md py-1 z-50 backdrop-blur-xl ring-1 ring-white/10">
                    {children}
                </div>
            )}
        </div>
    );
};

const MenuItem: React.FC<{ 
    label: string; 
    shortcut?: string; 
    onClick: () => void; 
    icon?: any;
    checked?: boolean;
    disabled?: boolean;
}> = ({ label, shortcut, onClick, icon: Icon, checked, disabled }) => (
    <button 
        onClick={() => { if(!disabled) onClick(); }}
        disabled={disabled}
        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between group ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-glass-accent hover:text-black text-glass-text'}`}
    >
        <div className="flex items-center gap-2">
            <div className="w-4 flex justify-center">
                {checked && <Check className="w-3 h-3" />}
                {Icon && !checked && <Icon className="w-3 h-3 text-glass-muted group-hover:text-black" />}
            </div>
            <span>{label}</span>
        </div>
        {shortcut && <span className="text-[10px] opacity-50 font-mono">{shortcut}</span>}
    </button>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#0F172A] border border-glass-border shadow-2xl p-4 rounded-lg z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
            <h3 className="text-xs font-bold text-glass-text uppercase">{title}</h3>
            <button onClick={onClose}><X className="w-4 h-4 text-glass-muted hover:text-white" /></button>
        </div>
        {children}
    </div>
);

// --- MAIN APP ---
export const NotepadApp: React.FC = () => {
    // Editor State
    const [content, setContent] = useState('');
    const [fileName, setFileName] = useState('Untitled.txt');
    const [isDirty, setIsDirty] = useState(false);
    
    // UI Config State
    const [wordWrap, setWordWrap] = useState(false);
    const [showStatusBar, setShowStatusBar] = useState(true);
    const [zoom, setZoom] = useState(100);
    const [fontConfig, setFontConfig] = useState<FontConfig>({ family: 'mono', size: 14, weight: 'normal' });
    
    // Cursor Tracking
    const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Menus State
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [showFindModal, setShowFindModal] = useState(false);
    const [showFontModal, setShowFontModal] = useState(false);
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // --- HANDLERS ---

    const updateCursorStats = () => {
        if (!textareaRef.current) return;
        const selectionStart = textareaRef.current.selectionStart;
        const textUpToCursor = textareaRef.current.value.substring(0, selectionStart);
        const lines = textUpToCursor.split('\n');
        setCursorPos({
            ln: lines.length,
            col: lines[lines.length - 1].length + 1
        });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setIsDirty(true);
        updateCursorStats();
    };

    // File Operations
    const handleNew = () => {
        if (isDirty && !window.confirm("Descartar alterações não salvas?")) return;
        setContent('');
        setFileName('Untitled.txt');
        setIsDirty(false);
        setActiveMenu(null);
    };

    const handleOpenClick = () => {
        fileInputRef.current?.click();
        setActiveMenu(null);
    };

    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            setContent(ev.target?.result as string);
            setFileName(file.name);
            setIsDirty(false);
        };
        reader.readAsText(file);
    };

    const handleSave = () => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDirty(false);
        setActiveMenu(null);
    };

    // Edit Operations
    const insertDateTime = () => {
        const now = new Date().toLocaleString();
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newText = content.substring(0, start) + now + content.substring(end);
            setContent(newText);
            setIsDirty(true);
        }
        setActiveMenu(null);
    };

    const handleFind = () => {
        if (!searchTerm) return;
        // Simple find: Selects the first occurrence after current cursor
        if (!textareaRef.current) return;
        
        const text = textareaRef.current.value;
        const startPos = textareaRef.current.selectionEnd;
        const index = text.indexOf(searchTerm, startPos);
        
        if (index !== -1) {
            textareaRef.current.setSelectionRange(index, index + searchTerm.length);
            textareaRef.current.focus();
            updateCursorStats();
        } else {
            // Loop around
            const indexWrap = text.indexOf(searchTerm, 0);
            if (indexWrap !== -1) {
                textareaRef.current.setSelectionRange(indexWrap, indexWrap + searchTerm.length);
                textareaRef.current.focus();
                updateCursorStats();
            } else {
                alert(`"${searchTerm}" não encontrado.`);
            }
        }
    };

    // Style Helpers
    const getFontFamily = () => {
        switch (fontConfig.family) {
            case 'mono': return "font-mono";
            case 'serif': return "font-serif";
            default: return "font-sans";
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0F172A]/90 backdrop-blur-xl text-glass-text select-none relative">
            
            {/* --- MENU BAR --- */}
            <div className="h-8 bg-glass-panel border-b border-glass-border flex items-center px-2 gap-1 shrink-0 z-20">
                <div className="mr-2 px-2 bg-glass-secondary border border-glass-border rounded-md">
                    <FileText className="w-3.5 h-3.5 text-glass-accent" />
                </div>
                
                <MenuDropdown 
                    label="Arquivo" 
                    isOpen={activeMenu === 'file'} 
                    onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                    onClose={() => setActiveMenu(null)}
                >
                    <MenuItem label="Novo" shortcut="Ctrl+N" onClick={handleNew} />
                    <MenuItem label="Abrir..." shortcut="Ctrl+O" onClick={handleOpenClick} icon={FolderOpen} />
                    <MenuItem label="Salvar" shortcut="Ctrl+S" onClick={handleSave} icon={Save} />
                    <div className="h-px bg-white/10 my-1" />
                    <MenuItem label="Sair" onClick={() => {}} disabled />
                </MenuDropdown>

                <MenuDropdown 
                    label="Editar" 
                    isOpen={activeMenu === 'edit'} 
                    onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                    onClose={() => setActiveMenu(null)}
                >
                    <MenuItem label="Desfazer" shortcut="Ctrl+Z" onClick={() => document.execCommand('undo')} icon={RotateCcw} />
                    <div className="h-px bg-white/10 my-1" />
                    <MenuItem label="Recortar" shortcut="Ctrl+X" onClick={() => navigator.clipboard.writeText(window.getSelection()?.toString() || '')} icon={Scissors} />
                    <MenuItem label="Copiar" shortcut="Ctrl+C" onClick={() => navigator.clipboard.writeText(window.getSelection()?.toString() || '')} icon={Copy} />
                    <MenuItem label="Colar" shortcut="Ctrl+V" onClick={async () => {
                        const text = await navigator.clipboard.readText();
                        if(textareaRef.current) {
                            const start = textareaRef.current.selectionStart;
                            const end = textareaRef.current.selectionEnd;
                            const newText = content.substring(0, start) + text + content.substring(end);
                            setContent(newText);
                        }
                    }} icon={Clipboard} />
                    <MenuItem label="Excluir" shortcut="Del" onClick={() => {}} />
                    <div className="h-px bg-white/10 my-1" />
                    <MenuItem label="Localizar..." shortcut="Ctrl+F" onClick={() => { setShowFindModal(true); setActiveMenu(null); }} icon={Search} />
                    <MenuItem label="Hora/Data" shortcut="F5" onClick={insertDateTime} />
                </MenuDropdown>

                <MenuDropdown 
                    label="Formatar" 
                    isOpen={activeMenu === 'format'} 
                    onClick={() => setActiveMenu(activeMenu === 'format' ? null : 'format')}
                    onClose={() => setActiveMenu(null)}
                >
                    <MenuItem 
                        label="Quebra Automática" 
                        onClick={() => { setWordWrap(!wordWrap); setActiveMenu(null); }} 
                        checked={wordWrap}
                    />
                    <MenuItem 
                        label="Fonte..." 
                        onClick={() => { setShowFontModal(true); setActiveMenu(null); }} 
                        icon={Type}
                    />
                </MenuDropdown>

                <MenuDropdown 
                    label="Exibir" 
                    isOpen={activeMenu === 'view'} 
                    onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                    onClose={() => setActiveMenu(null)}
                >
                    <MenuItem label="Ampliar" shortcut="Ctrl+" onClick={() => setZoom(z => Math.min(500, z + 10))} icon={ZoomIn} />
                    <MenuItem label="Reduzir" shortcut="Ctrl-" onClick={() => setZoom(z => Math.max(10, z - 10))} icon={ZoomOut} />
                    <MenuItem label="Restaurar Zoom" shortcut="Ctrl+0" onClick={() => setZoom(100)} />
                    <div className="h-px bg-white/10 my-1" />
                    <MenuItem 
                        label="Barra de Status" 
                        onClick={() => { setShowStatusBar(!showStatusBar); setActiveMenu(null); }} 
                        checked={showStatusBar}
                    />
                </MenuDropdown>
            </div>

            {/* --- EDITOR AREA --- */}
            <div className="flex-1 relative overflow-hidden bg-glass-base/30">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextChange}
                    onSelect={updateCursorStats}
                    onClick={updateCursorStats}
                    onKeyUp={updateCursorStats}
                    spellCheck={false}
                    className={`
                        w-full h-full p-4 bg-transparent outline-none resize-none text-glass-text selection:bg-glass-accent selection:text-black custom-scrollbar
                        ${getFontFamily()} 
                        ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}
                        ${fontConfig.weight === 'bold' ? 'font-bold' : 'font-normal'}
                    `}
                    style={{ 
                        fontSize: `${fontConfig.size * (zoom / 100)}px`,
                        lineHeight: '1.5'
                    }}
                />

                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.md,.json,.js,.ts,.css,.html" 
                    onChange={handleFileLoad} 
                />

                {/* MODALS */}
                {showFindModal && (
                    <Modal title="Localizar" onClose={() => setShowFindModal(false)}>
                        <div className="flex flex-col gap-2">
                            <input 
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Palavra-chave..."
                                className="bg-black/50 border border-glass-border rounded p-2 text-xs text-white outline-none focus:border-glass-accent"
                                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                            />
                            <button 
                                onClick={handleFind}
                                className="bg-glass-accent text-black font-bold text-xs py-1.5 rounded hover:bg-white transition-colors"
                            >
                                Buscar Próximo
                            </button>
                        </div>
                    </Modal>
                )}

                {showFontModal && (
                    <Modal title="Configurar Fonte" onClose={() => setShowFontModal(false)}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-glass-muted uppercase font-bold block mb-1">Família</label>
                                <div className="flex gap-1 bg-black/20 p-1 rounded border border-glass-border">
                                    <button onClick={() => setFontConfig(p => ({...p, family: 'mono'}))} className={`flex-1 py-1 text-xs rounded ${fontConfig.family === 'mono' ? 'bg-glass-accent text-black' : 'text-glass-muted hover:text-white'}`}>Mono</button>
                                    <button onClick={() => setFontConfig(p => ({...p, family: 'sans'}))} className={`flex-1 py-1 text-xs rounded ${fontConfig.family === 'sans' ? 'bg-glass-accent text-black' : 'text-glass-muted hover:text-white'}`}>Sans</button>
                                    <button onClick={() => setFontConfig(p => ({...p, family: 'serif'}))} className={`flex-1 py-1 text-xs rounded ${fontConfig.family === 'serif' ? 'bg-glass-accent text-black' : 'text-glass-muted hover:text-white'}`}>Serif</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-glass-muted uppercase font-bold block mb-1">Tamanho ({fontConfig.size}px)</label>
                                <input 
                                    type="range" min="8" max="72" 
                                    value={fontConfig.size} 
                                    onChange={(e) => setFontConfig(p => ({...p, size: parseInt(e.target.value)}))}
                                    className="w-full h-1 bg-glass-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-glass-accent [&::-webkit-slider-thumb]:appearance-none"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] text-glass-muted uppercase font-bold">Negrito</label>
                                <button 
                                    onClick={() => setFontConfig(p => ({...p, weight: p.weight === 'bold' ? 'normal' : 'bold'}))}
                                    className={`w-8 h-4 rounded-full border border-glass-border relative transition-colors ${fontConfig.weight === 'bold' ? 'bg-glass-accent' : 'bg-black/20'}`}
                                >
                                    <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-all ${fontConfig.weight === 'bold' ? 'left-4' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>

            {/* --- STATUS BAR --- */}
            {showStatusBar && (
                <div className="h-6 bg-glass-panel border-t border-glass-border flex items-center justify-end px-4 gap-6 text-[10px] font-mono text-glass-muted shrink-0 select-none">
                    <div className="hover:text-glass-text transition-colors">
                        Ln {cursorPos.ln}, Col {cursorPos.col}
                    </div>
                    <div className="hover:text-glass-text transition-colors">
                        {zoom}%
                    </div>
                    <div className="hover:text-glass-text transition-colors">
                        Windows (CRLF)
                    </div>
                    <div className="hover:text-glass-text transition-colors">
                        UTF-8
                    </div>
                </div>
            )}
        </div>
    );
};
