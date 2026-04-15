/**
 * Icon mapping utility
 * Maps string icon names to lucide-react components
 */

import {
  Type, Mail, Lock, Hash, Percent, SlidersHorizontal,
  CircleDot, CheckSquare, ArrowUpDown, FileSpreadsheet,
  MapPin, Route, Pentagon, Calendar, Clock,
  Camera, Mic, Paperclip, ScanLine,
  StickyNote, FolderOpen, Repeat, Calculator, EyeOff,
  Play, Square, User, Smartphone, Info, Layers,
  List, CalendarClock, LucideIcon, GripVertical,
  Trash2, Copy, ChevronDown, ChevronRight,
  Download, Upload, Settings, Undo2, Redo2, Plus,
  Eye, FileText, X, Search, AlertCircle, HelpCircle,
  ToggleLeft, Maximize2, Minimize2,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Type, Mail, Lock, Hash, Percent, SlidersHorizontal,
  CircleDot, CheckSquare, ArrowUpDown, FileSpreadsheet,
  MapPin, Route, Pentagon, Calendar, Clock,
  Camera, Mic, Paperclip, ScanLine,
  StickyNote, FolderOpen, Repeat, Calculator, EyeOff,
  Play, Square, User, Smartphone, Info, Layers,
  List, CalendarClock, GripVertical,
  Trash2, Copy, ChevronDown, ChevronRight,
  Download, Upload, Settings, Undo2, Redo2, Plus,
  Eye, FileText, X, Search, AlertCircle, HelpCircle,
  ToggleLeft, Maximize2, Minimize2,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Info;
}

export {
  Type, Mail, Lock, Hash, Percent, SlidersHorizontal,
  CircleDot, CheckSquare, ArrowUpDown, FileSpreadsheet,
  MapPin, Route, Pentagon, Calendar, Clock,
  Camera, Mic, Paperclip, ScanLine,
  StickyNote, FolderOpen, Repeat, Calculator, EyeOff,
  Play, Square, User, Smartphone, Info, Layers,
  List, CalendarClock, GripVertical,
  Trash2, Copy, ChevronDown, ChevronRight,
  Download, Upload, Settings, Undo2, Redo2, Plus,
  Eye, FileText, X, Search, AlertCircle, HelpCircle,
  ToggleLeft, Maximize2, Minimize2,
};
