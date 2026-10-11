import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  ArrowLeft, 
  MapPin, 
  Home, 
  Layers, 
  ShieldCheck, 
  DollarSign, 
  User, 
  AlertCircle,
  Building2,
  HardHat,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ChevronsUpDown,
  Sparkles,
  PhoneCall,
  ExternalLink,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  X
} from 'lucide-react';
import type { 
  FlatRecord, 
  ListingStatus, 
  FacingDirection, 
  ContactStatus,
  DrawingDiningArrangement,
  GasLineType, 
  WaterSupplyType, 
  RegistrationStatusType, 
  MutationStatusType, 
  BankLoanType,
  FlatPositionType,
  RajukApprovalType,
  LandShareType,
  PropertyType 
} from '../types.ts';
import { 
  normalizePhone, 
  formatBangladeshiCurrency, 
  formatBangladeshiCompact,
  formatBangladeshiCroreLakh,
  resolveDrawingDining,
  resolveFacingDirections
} from '../types.ts';
import type { User as FirebaseUser } from '../firebase.ts';
import { DuplicateWarningModal } from './DuplicateWarningModal.tsx';

interface FlatFormProps {
  initialFlat?: FlatRecord | null;
  currentUser: FirebaseUser;
  existingFlats: FlatRecord[];
  onSave: (flatData: Omit<FlatRecord, 'id' | 'createdAt' | 'updatedAt'>, isSaveAndNew?: boolean) => Promise<void>;
  onCancel: () => void;
  onOpenExisting?: (flat: FlatRecord) => void;
  isSaving: boolean;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ALL_FACING_DIRECTIONS: FacingDirection[] = [
  'North',
  'South',
  'East',
  'West',
  'North-East',
  'North-West',
  'South-East',
  'South-West'
];

// Reusable Tri-State (Yes / No / ?) Toggle
interface TriStateToggleProps {
  label: string;
  value: boolean | null | undefined;
  onChange: (val: boolean | null) => void;
  subtitle?: string;
}

const TriStateToggle: React.FC<TriStateToggleProps> = ({ label, value, onChange, subtitle }) => {
  const isYes = value === true;
  const isNo = value === false;
  const isUnset = value === null || value === undefined;

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors">
      <div className="pr-2 min-w-0 flex-1">
        <span className="text-xs font-semibold text-gray-800 block truncate">{label}</span>
        {subtitle && <span className="text-[10px] text-gray-400 block truncate">{subtitle}</span>}
      </div>
      <div className="inline-flex rounded-md shadow-xs p-0.5 bg-gray-100 flex-shrink-0 text-xs gap-0.5">
        <button
          type="button"
          onClick={() => onChange(isYes ? null : true)}
          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
            isYes
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
          title="Click to select Yes (click again to unselect)"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(isNo ? null : false)}
          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
            isNo
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
          title="Click to select No (click again to unselect)"
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
            isUnset
              ? 'bg-white text-gray-800 shadow-xs ring-1 ring-gray-200'
              : 'text-gray-400 hover:text-gray-700'
          }`}
          title="Unknown / Not Specified"
        >
          ?
        </button>
      </div>
    </div>
  );
};

// Reusable Stepper Input
interface StepperInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  min?: number;
}

const StepperInput: React.FC<StepperInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '0',
  min = 0,
}) => {
  const num = parseInt(value, 10);
  const currentVal = isNaN(num) ? '' : num;

  const handleDecrement = () => {
    if (currentVal === '' || currentVal <= min) {
      onChange('');
    } else {
      onChange(String(currentVal - 1));
    }
  };

  const handleIncrement = () => {
    if (currentVal === '') {
      onChange('1');
    } else {
      onChange(String(currentVal + 1));
    }
  };

  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 block mb-1">{label}</label>
      <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-xs focus-within:ring-2 focus-within:ring-[#D35400] focus-within:border-transparent overflow-hidden">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border-r border-gray-200 flex-shrink-0"
          title="Decrease"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            onChange(val);
          }}
          placeholder={placeholder}
          className="w-full text-center py-2 px-1 text-sm font-bold text-gray-900 focus:outline-hidden"
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border-l border-gray-200 flex-shrink-0"
          title="Increase"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const FlatForm: React.FC<FlatFormProps> = ({
  initialFlat,
  currentUser,
  existingFlats,
  onSave,
  onCancel,
  onOpenExisting,
  isSaving,
  onShowToast,
}) => {
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isSavingState = Boolean(isSaving || isLocalSaving);

  // =========================================================================
  // LEVEL 1: QUICK CAPTURE STATE
  // =========================================================================
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialFlat?.propertyType || 'Ready Flat'
  );
  const [projectName, setProjectName] = useState(
    initialFlat?.projectName || initialFlat?.buildingHouseNo || ''
  );
  const [location, setLocation] = useState(initialFlat?.location || '');
  const [area, setArea] = useState(initialFlat?.area || '');
  useEffect(() => {
    // Simplified dirty check: comparing current state with initialFlat.
    // In a full implementation, compare all fields. For now, check key ones.
    const hasChanged = 
      projectName !== (initialFlat?.projectName || initialFlat?.buildingHouseNo || '') ||
      location !== (initialFlat?.location || '') ||
      area !== (initialFlat?.area || '');
    setIsDirty(hasChanged);
  }, [projectName, location, area, initialFlat]);


  const todayStr = new Date().toISOString().split('T')[0];

  const availableAreas = useMemo(() => {
    const counts: Record<string, number> = {};
    existingFlats.forEach((f) => {
      if (f.area && f.area.trim()) {
        const a = f.area.trim();
        counts[a] = (counts[a] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [existingFlats]);
  const [ownerName, setOwnerName] = useState(
    initialFlat?.ownerName || initialFlat?.contactPerson || ''
  );
  const [phoneNumber, setPhoneNumber] = useState(initialFlat?.phoneNumber || '');
  const [flatSize, setFlatSize] = useState<string>(
    initialFlat?.flatSize !== null && initialFlat?.flatSize !== undefined ? String(initialFlat.flatSize) : ''
  );
  const [bedrooms, setBedrooms] = useState<string>(
    initialFlat?.bedrooms !== null && initialFlat?.bedrooms !== undefined ? String(initialFlat.bedrooms) : ''
  );
  const [bathrooms, setBathrooms] = useState<string>(
    initialFlat?.bathrooms !== null && initialFlat?.bathrooms !== undefined ? String(initialFlat.bathrooms) : ''
  );

  // Price Mode: 'total' (Total asking price) | 'rate' (Price per sq ft)
  const initialHasRateOnly = (!initialFlat?.askingPrice && initialFlat?.ratePerSqFt);
  const [priceMode, setPriceMode] = useState<'total' | 'rate'>(initialHasRateOnly ? 'rate' : 'total');
  const [askingPrice, setAskingPrice] = useState<string>(
    initialFlat?.askingPrice !== null && initialFlat?.askingPrice !== undefined ? String(initialFlat.askingPrice) : ''
  );
  const [ratePerSqFt, setRatePerSqFt] = useState<string>(
    initialFlat?.ratePerSqFt !== null && initialFlat?.ratePerSqFt !== undefined ? String(initialFlat.ratePerSqFt) : ''
  );

  // =========================================================================
  // LEVEL 2: PROGRESSIVE DISCLOSURE (FOLDED SECTIONS) STATE
  // =========================================================================

  // Card 1: Building, Floor & Facilities
  const [floorNo, setFloorNo] = useState<string>(
    initialFlat?.floorNo !== null && initialFlat?.floorNo !== undefined ? String(initialFlat.floorNo) : ''
  );
  const [totalFloors, setTotalFloors] = useState<string>(
    initialFlat?.totalFloors !== null && initialFlat?.totalFloors !== undefined ? String(initialFlat.totalFloors) : ''
  );
  const [buildingStructure, setBuildingStructure] = useState(initialFlat?.buildingStructure || '');
  const [floorsAvailable, setFloorsAvailable] = useState(
    initialFlat?.floorsAvailable || initialFlat?.unsoldFloors || ''
  );
  const [totalFlatsInProject, setTotalFlatsInProject] = useState<string>(
    initialFlat?.totalFlatsInProject !== null && initialFlat?.totalFlatsInProject !== undefined ? String(initialFlat.totalFlatsInProject) : ''
  );
  const [unsoldFlatsCount, setUnsoldFlatsCount] = useState<string>(
    initialFlat?.unsoldFlatsCount !== null && initialFlat?.unsoldFlatsCount !== undefined ? String(initialFlat.unsoldFlatsCount) : ''
  );
  const [facingDirections, setFacingDirections] = useState<FacingDirection[]>(
    initialFlat ? resolveFacingDirections(initialFlat) : []
  );
  const [flatPosition, setFlatPosition] = useState<FlatPositionType | ''>(
    initialFlat?.flatPosition || ''
  );
  const [facingNotes, setFacingNotes] = useState(initialFlat?.facingNotes || '');

  // Facilities Checkboxes (Tri-State: true / false / null)
  // Default is null (unselected / unknown) on new entries
  const [liftAvailable, setLiftAvailable] = useState<boolean | null>(
    initialFlat?.liftAvailable !== undefined && initialFlat?.liftAvailable !== null ? !!initialFlat.liftAvailable : null
  );
  const [generatorAvailable, setGeneratorAvailable] = useState<boolean | null>(
    initialFlat?.generatorAvailable !== undefined && initialFlat?.generatorAvailable !== null ? !!initialFlat.generatorAvailable : null
  );
  const [parkingAvailable, setParkingAvailable] = useState<boolean | null>(
    initialFlat?.parkingAvailable !== undefined && initialFlat?.parkingAvailable !== null ? !!initialFlat.parkingAvailable : null
  );
  const [intercomAvailable, setIntercomAvailable] = useState<boolean | null>(
    initialFlat?.intercomAvailable !== undefined && initialFlat?.intercomAvailable !== null ? !!initialFlat.intercomAvailable : null
  );
  const [security24x7, setSecurity24x7] = useState<boolean | null>(
    initialFlat?.security24x7 !== undefined && initialFlat?.security24x7 !== null ? !!initialFlat.security24x7 : null
  );
  const [fireExitAvailable, setFireExitAvailable] = useState<boolean | null>(
    initialFlat?.fireExitAvailable !== undefined && initialFlat?.fireExitAvailable !== null ? !!initialFlat.fireExitAvailable : null
  );
  const [communityHallAvailable, setCommunityHallAvailable] = useState<boolean | null>(
    initialFlat?.communityHallAvailable !== undefined && initialFlat?.communityHallAvailable !== null ? !!initialFlat.communityHallAvailable : null
  );
  const [solarAvailable, setSolarAvailable] = useState<boolean | null>(
    initialFlat?.solarAvailable !== undefined && initialFlat?.solarAvailable !== null ? !!initialFlat.solarAvailable : null
  );

  // Card 2: Interior & Layout Details
  const [balconies, setBalconies] = useState<string>(
    initialFlat?.balconies !== null && initialFlat?.balconies !== undefined ? String(initialFlat.balconies) : ''
  );
  const [drawingRooms, setDrawingRooms] = useState<string>(
    initialFlat?.drawingRooms !== null && initialFlat?.drawingRooms !== undefined ? String(initialFlat.drawingRooms) : ''
  );
  const [diningRooms, setDiningRooms] = useState<string>(
    initialFlat?.diningRooms !== null && initialFlat?.diningRooms !== undefined ? String(initialFlat.diningRooms) : ''
  );
  const [drawingDiningArrangement, setDrawingDiningArrangement] = useState<DrawingDiningArrangement | ''>(
    initialFlat ? resolveDrawingDining(initialFlat) : ''
  );
  const [layoutDescription, setLayoutDescription] = useState(initialFlat?.layoutDescription || '');

  // Card 3: Pricing & Payment Breakdown
  const [utilityCharges, setUtilityCharges] = useState<string>(
    initialFlat?.utilityCharges !== null && initialFlat?.utilityCharges !== undefined ? String(initialFlat.utilityCharges) : ''
  );
  const [parkingCharges, setParkingCharges] = useState<string>(
    initialFlat?.parkingCharges !== null && initialFlat?.parkingCharges !== undefined ? String(initialFlat.parkingCharges) : ''
  );
  const [otherCharges, setOtherCharges] = useState<string>(
    initialFlat?.otherCharges !== null && initialFlat?.otherCharges !== undefined ? String(initialFlat.otherCharges) : ''
  );
  const [customGrandTotal, setCustomGrandTotal] = useState<string>(
    initialFlat?.grandTotalPrice !== null && initialFlat?.grandTotalPrice !== undefined ? String(initialFlat.grandTotalPrice) : ''
  );
  // Tri-State negotiable: default null (unselected / unknown)
  const [negotiable, setNegotiable] = useState<boolean | null>(
    initialFlat?.negotiable !== undefined && initialFlat?.negotiable !== null ? !!initialFlat.negotiable : null
  );
  const [paymentTerms, setPaymentTerms] = useState(initialFlat?.paymentTerms || '');
  const [downPayment, setDownPayment] = useState<string>(
    initialFlat?.downPayment !== null && initialFlat?.downPayment !== undefined ? String(initialFlat.downPayment) : ''
  );
  const [handoverDate, setHandoverDate] = useState(initialFlat?.handoverDate || '');

  // Card 4: Utilities & Documentation / Legal
  const [gasLine, setGasLine] = useState<GasLineType | ''>(initialFlat?.gasLine || '');
  // Tri-State separateElectricMeter: default null (unselected / unknown), NOT true
  const [separateElectricMeter, setSeparateElectricMeter] = useState<boolean | null>(
    initialFlat?.separateElectricMeter !== undefined && initialFlat?.separateElectricMeter !== null ? !!initialFlat.separateElectricMeter : null
  );
  const [waterSupply, setWaterSupply] = useState<WaterSupplyType | ''>(initialFlat?.waterSupply || '');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatusType | ''>(initialFlat?.registrationStatus || '');
  const [mutationStatus, setMutationStatus] = useState<MutationStatusType | ''>(initialFlat?.mutationStatus || '');
  const [rajukApproval, setRajukApproval] = useState<RajukApprovalType | ''>(initialFlat?.rajukApproval || '');
  const [landShareType, setLandShareType] = useState<LandShareType | ''>(initialFlat?.landShareType || '');
  const [bankLoanPossible, setBankLoanPossible] = useState<BankLoanType | ''>(initialFlat?.bankLoanPossible || '');
  const [documentationNotes, setDocumentationNotes] = useState(initialFlat?.documentationNotes || '');

  // Card 5: Contact, Follow-up & Dates
  const [developerName, setDeveloperName] = useState(initialFlat?.developerName || '');
  const [plotHouseNo, setPlotHouseNo] = useState(
    initialFlat?.plotHouseNo || initialFlat?.buildingHouseNo || ''
  );
  const [dateRecorded, setDateRecorded] = useState(
    initialFlat?.dateRecorded || (initialFlat ? '' : todayStr)
  );
  const [contactStatus, setContactStatus] = useState<ContactStatus>(
    initialFlat?.contactStatus || 'Not Contacted Yet'
  );
  const [dateContacted, setDateContacted] = useState(initialFlat?.dateContacted || '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(initialFlat?.nextFollowUpDate || '');
  const [followUpNotes, setFollowUpNotes] = useState(initialFlat?.followUpNotes || '');

  // Card 6: Listing Status, Media & Notes
  const [listingStatus, setListingStatus] = useState<ListingStatus>(initialFlat?.listingStatus || 'Available');
  const [mediaLink, setMediaLink] = useState(initialFlat?.mediaLink || '');
  const [additionalNotes, setAdditionalNotes] = useState(initialFlat?.additionalNotes || '');

  // =========================================================================
  // FOLDED SECTIONS EXPANSION STATE
  // =========================================================================
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    building: false,
    interior: false,
    pricing: false,
    legal: false,
    contact: false,
    listing: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const areAllExpanded = Object.values(expandedSections).every(Boolean);
  const toggleAllSections = () => {
    const nextState = !areAllExpanded;
    setExpandedSections({
      building: nextState,
      interior: nextState,
      pricing: nextState,
      legal: nextState,
      contact: nextState,
      listing: nextState,
    });
  };

  // Price Ticket toggle state (default: folded/false)
  const [isPriceTicketOpen, setIsPriceTicketOpen] = useState(false);

  // Validation Guard & Duplicate Modal State
  const [emptyFormError, setEmptyFormError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ code: string; message: string; fullDetails: string } | null>(null);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [pendingIsSaveAndNew, setPendingIsSaveAndNew] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateMatchedFlat, setDuplicateMatchedFlat] = useState<FlatRecord | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Omit<FlatRecord, 'id' | 'createdAt' | 'updatedAt'> | null>(null);

  // Form Reset Function for "Save & New"
  const resetForm = () => {
    setPropertyType('Ready Flat');
    setProjectName('');
    setDeveloperName('');
    setOwnerName('');
    setPhoneNumber('');
    setLocation('');
    setPlotHouseNo('');
    setDateRecorded(new Date().toISOString().split('T')[0]);
    setContactStatus('Not Contacted Yet');
    setDateContacted('');
    setNextFollowUpDate('');
    setFlatSize('');
    setBedrooms('');
    setBathrooms('');
    setBalconies('');
    setDrawingRooms('');
    setDiningRooms('');
    setDrawingDiningArrangement(null);
    setLayoutDescription('');
    setFloorNo('');
    setTotalFloors('');
    setBuildingStructure('');
    setFloorsAvailable('');
    setTotalFlatsInProject('');
    setUnsoldFlatsCount('');
    setFacingDirections([]);
    setFlatPosition(null);
    setFacingNotes('');
    setLiftAvailable(null);
    setGeneratorAvailable(null);
    setParkingAvailable(null);
    setIntercomAvailable(null);
    setSecurity24x7(null);
    setFireExitAvailable(null);
    setCommunityHallAvailable(null);
    setSolarAvailable(null);
    setGasLine(null);
    setSeparateElectricMeter(null);
    setWaterSupply(null);
    setRegistrationStatus(null);
    setMutationStatus(null);
    setRajukApproval(null);
    setLandShareType(null);
    setBankLoanPossible(null);
    setDocumentationNotes('');
    setAskingPrice('');
    setRatePerSqFt('');
    setPriceMode('total');
    setUtilityCharges('');
    setParkingCharges('');
    setOtherCharges('');
    setCustomGrandTotal('');
    setNegotiable(null);
    setPaymentTerms('');
    setDownPayment('');
    setHandoverDate('');
    setListingStatus('Available');
    setMediaLink('');
    setAdditionalNotes('');
    setFollowUpNotes('');
    setEmptyFormError(null);
    setSaveError(null);
    setCopiedDetails(false);
  };

  const collectorString = currentUser?.displayName 
    ? `${currentUser.displayName} (${currentUser?.email || ''})`
    : currentUser?.email || 'Team Collector';

  // =========================================================================
  // LIVE PRICE CALCULATIONS & AUTO-SYNC
  // =========================================================================
  const numFlatSize = parseFloat(flatSize) || 0;
  const numRate = parseFloat(ratePerSqFt) || 0;
  const numAskingPrice = parseFloat(askingPrice) || 0;
  const numUtility = parseFloat(utilityCharges) || 0;
  const numParking = parseFloat(parkingCharges) || 0;
  const numOther = parseFloat(otherCharges) || 0;

  // Resolved Total Base Price
  const resolvedBasePrice: number | null = numAskingPrice > 0 
    ? numAskingPrice 
    : (numFlatSize > 0 && numRate > 0 ? numFlatSize * numRate : null);

  // Resolved Rate per sq ft
  const resolvedRate: number | null = numRate > 0
    ? numRate
    : (numAskingPrice > 0 && numFlatSize > 0 ? Math.round(numAskingPrice / numFlatSize) : null);

  // Grand Total: Base Price + Utility + Parking + Other (or user custom override)
  const computedGrandTotal: number | null = resolvedBasePrice !== null
    ? resolvedBasePrice + numUtility + numParking + numOther
    : (numUtility + numParking + numOther > 0 ? numUtility + numParking + numOther : null);

  const displayGrandTotal = customGrandTotal ? parseFloat(customGrandTotal) : computedGrandTotal;

  // Handle Quick Price input change depending on mode
  const handleQuickPriceChange = (val: string) => {
    if (priceMode === 'total') {
      setAskingPrice(val);
      const parsedTotal = parseFloat(val);
      if (parsedTotal > 0 && numFlatSize > 0) {
        setRatePerSqFt(String(Math.round(parsedTotal / numFlatSize)));
      }
    } else {
      setRatePerSqFt(val);
      const parsedRate = parseFloat(val);
      if (parsedRate > 0 && numFlatSize > 0) {
        setAskingPrice(String(Math.round(parsedRate * numFlatSize)));
      }
    }
  };

  // When flat size changes, keep rate and asking price in sync if one is entered
  const handleFlatSizeChange = (val: string) => {
    setFlatSize(val);
    const parsedSize = parseFloat(val);
    if (parsedSize > 0) {
      if (priceMode === 'total' && numAskingPrice > 0) {
        setRatePerSqFt(String(Math.round(numAskingPrice / parsedSize)));
      } else if (priceMode === 'rate' && numRate > 0) {
        setAskingPrice(String(Math.round(numRate * parsedSize)));
      }
    }
  };

  // Multi-select facing direction toggle
  const toggleFacingDirection = (dir: FacingDirection) => {
    setFacingDirections((prev) => 
      prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir]
    );
  };

  // Guard: Check if form is completely empty (excluding default propertyType)
  const isFormCompletelyEmpty = (): boolean => {
    const hasValue = (val: any) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      if (typeof val === 'number') return !isNaN(val);
      if (typeof val === 'boolean') return true;
      if (Array.isArray(val)) return val.length > 0;
      return false;
    };

    const fields = [
      projectName, location, ownerName, phoneNumber, flatSize, bedrooms, bathrooms,
      askingPrice, ratePerSqFt, floorNo, totalFloors, buildingStructure, floorsAvailable,
      totalFlatsInProject, unsoldFlatsCount, facingDirections, flatPosition, facingNotes,
      liftAvailable, generatorAvailable, parkingAvailable, intercomAvailable, security24x7,
      fireExitAvailable, communityHallAvailable, solarAvailable, balconies, drawingRooms,
      diningRooms, drawingDiningArrangement, layoutDescription, utilityCharges,
      parkingCharges, otherCharges, customGrandTotal, negotiable, paymentTerms,
      downPayment, handoverDate, gasLine, separateElectricMeter, waterSupply,
      registrationStatus, mutationStatus, rajukApproval, landShareType,
      bankLoanPossible, documentationNotes, developerName, plotHouseNo,
      dateContacted, nextFollowUpDate, followUpNotes, mediaLink, additionalNotes
    ];

    return !fields.some(hasValue);
  };

  // Section field fill counters for progressive disclosure cards
  const countFilled = (items: (string | number | boolean | any[] | null | undefined)[]) => {
    return items.filter((val) => {
      if (val === null || val === undefined || val === '') return false;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    }).length;
  };

  const buildingFilledCount = countFilled([
    floorNo, totalFloors, buildingStructure, floorsAvailable,
    totalFlatsInProject, unsoldFlatsCount, facingDirections, flatPosition, facingNotes,
    liftAvailable, generatorAvailable, parkingAvailable, intercomAvailable,
    security24x7, fireExitAvailable, communityHallAvailable, solarAvailable
  ]);

  const interiorFilledCount = countFilled([
    balconies, drawingRooms, diningRooms, drawingDiningArrangement, layoutDescription
  ]);

  const pricingFilledCount = countFilled([
    utilityCharges, parkingCharges, otherCharges, customGrandTotal, negotiable, paymentTerms, downPayment, handoverDate
  ]);

  const legalFilledCount = countFilled([
    gasLine, separateElectricMeter, waterSupply, registrationStatus, mutationStatus, rajukApproval, landShareType, bankLoanPossible, documentationNotes
  ]);

  const contactFilledCount = countFilled([
    developerName, plotHouseNo, dateRecorded, dateContacted, nextFollowUpDate, followUpNotes
  ]);

  const listingFilledCount = countFilled([
    mediaLink, additionalNotes
  ]);

  // Synchronous button click handler for all Save buttons (instant tap feedback)
  const handleSaveButtonClick = (
    e: React.MouseEvent | React.FormEvent,
    isSaveAndNew: boolean = false
  ) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // 1. Immediately and synchronously set saving state on tap
    setIsLocalSaving(true);

    // 2. Immediate user tap feedback toast
    if (onShowToast) {
      onShowToast('Save tapped', 'info');
    }

    // 3. Initiate submission
    handleSubmit(e, isSaveAndNew);
  };

  // Submission handler
  const handleSubmit = async (
    e?: React.FormEvent | React.MouseEvent,
    isSaveAndNew: boolean = false
  ) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }

    // Ensure synchronous saving state
    setIsLocalSaving(true);

    if (isFormCompletelyEmpty()) {
      setIsLocalSaving(false);
      setEmptyFormError('Please fill in at least one field before saving.');
      setSaveError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setEmptyFormError(null);
    setSaveError(null);

    // Build complete payload cleanly (avoid undefined values)
    const payload: Omit<FlatRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      propertyType,
      projectName: projectName.trim(),
      developerName: developerName.trim(),
      ownerName: ownerName.trim(),
      contactPerson: ownerName.trim(),
      phoneNumber: phoneNumber.trim(),
      location: location.trim(),
      area: area.trim(),
      plotHouseNo: plotHouseNo.trim(),
      buildingHouseNo: plotHouseNo.trim() || projectName.trim(),
      dateRecorded: dateRecorded || todayStr,
      contactStatus,
      dateContacted: dateContacted ? dateContacted.trim() : '',
      nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.trim() : '',

      flatSize: flatSize !== '' && !isNaN(Number(flatSize)) ? parseFloat(flatSize) : null,
      bedrooms: bedrooms !== '' && !isNaN(Number(bedrooms)) ? parseInt(bedrooms, 10) : null,
      bathrooms: bathrooms !== '' && !isNaN(Number(bathrooms)) ? parseInt(bathrooms, 10) : null,
      balconies: balconies !== '' && !isNaN(Number(balconies)) ? parseInt(balconies, 10) : null,
      drawingRooms: drawingRooms !== '' && !isNaN(Number(drawingRooms)) ? parseInt(drawingRooms, 10) : null,
      diningRooms: diningRooms !== '' && !isNaN(Number(diningRooms)) ? parseInt(diningRooms, 10) : null,
      drawingDiningArrangement: drawingDiningArrangement || null,
      drawingDining: drawingDiningArrangement === 'Separate' ? 'Yes, separate' : drawingDiningArrangement === 'Combined' ? 'No, combined' : null,
      layoutDescription: layoutDescription.trim(),

      floorNo: floorNo !== '' && !isNaN(Number(floorNo)) ? parseInt(floorNo, 10) : null,
      totalFloors: totalFloors !== '' && !isNaN(Number(totalFloors)) ? parseInt(totalFloors, 10) : null,
      buildingStructure: buildingStructure.trim(),
      floorsAvailable: floorsAvailable.trim(),
      unsoldFloors: floorsAvailable.trim(),
      totalFlatsInProject: totalFlatsInProject !== '' && !isNaN(Number(totalFlatsInProject)) ? parseInt(totalFlatsInProject, 10) : null,
      unsoldFlatsCount: unsoldFlatsCount !== '' && !isNaN(Number(unsoldFlatsCount)) ? parseInt(unsoldFlatsCount, 10) : null,
      facingDirections: facingDirections.length > 0 ? facingDirections : [],
      facing: facingDirections.length > 0 ? facingDirections.join(', ') : null,
      flatPosition: flatPosition || null,
      facingNotes: facingNotes.trim(),

      // Amenities (Tri-state booleans)
      liftAvailable,
      generatorAvailable,
      parkingAvailable,
      intercomAvailable,
      security24x7,
      fireExitAvailable,
      communityHallAvailable,
      solarAvailable,

      // Utilities & Legal
      gasLine: gasLine || null,
      separateElectricMeter,
      waterSupply: waterSupply || null,
      registrationStatus: registrationStatus || null,
      mutationStatus: mutationStatus || null,
      rajukApproval: rajukApproval || null,
      landShareType: landShareType || null,
      bankLoanPossible: bankLoanPossible || null,
      documentationNotes: documentationNotes.trim(),

      // Pricing & Payment
      ratePerSqFt: ratePerSqFt !== '' && !isNaN(Number(ratePerSqFt)) ? parseFloat(ratePerSqFt) : (resolvedRate || null),
      askingPrice: askingPrice !== '' && !isNaN(Number(askingPrice)) ? parseFloat(askingPrice) : (resolvedBasePrice || null),
      utilityCharges: utilityCharges !== '' && !isNaN(Number(utilityCharges)) ? parseFloat(utilityCharges) : null,
      parkingCharges: parkingCharges !== '' && !isNaN(Number(parkingCharges)) ? parseFloat(parkingCharges) : null,
      otherCharges: otherCharges !== '' && !isNaN(Number(otherCharges)) ? parseFloat(otherCharges) : null,
      grandTotalPrice: customGrandTotal !== '' && !isNaN(Number(customGrandTotal)) ? parseFloat(customGrandTotal) : (computedGrandTotal || null),
      negotiable,
      paymentTerms: paymentTerms.trim(),
      downPayment: downPayment !== '' && !isNaN(Number(downPayment)) ? parseFloat(downPayment) : null,
      handoverDate: handoverDate.trim(),

      // Listing, Media & Notes
      listingStatus,
      mediaLink: mediaLink.trim(),
      additionalNotes: additionalNotes.trim(),
      followUpNotes: followUpNotes.trim(),

      // Collector Tracking
      collectedBy: initialFlat?.collectedBy || collectorString,
      collectedByUid: initialFlat?.collectedByUid || currentUser?.uid || '',
      collectedByEmail: initialFlat?.collectedByEmail || currentUser?.email || '',
      createdBy: initialFlat?.createdBy || collectorString,
    };

    // Duplicate Phone Check for new or modified entries
    const normalizedNew = normalizePhone(phoneNumber);
    if (normalizedNew.length >= 7) {
      const match = existingFlats.find((f) => {
        if (initialFlat?.id && f.id === initialFlat.id) return false;
        return normalizePhone(f.phoneNumber) === normalizedNew;
      });

      if (match) {
        setIsLocalSaving(false);
        setDuplicateMatchedFlat(match);
        setPendingPayload(payload);
        setPendingIsSaveAndNew(isSaveAndNew);
        setDuplicateModalOpen(true);
        return;
      }
    }

    try {
      await onSave(payload, isSaveAndNew);
      if (isSaveAndNew) {
        resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('FlatForm submission error:', err);
      const code = err?.code || (err?.name && err?.name !== 'Error' ? err?.name : '') || 'save-error';
      const message = err?.originalMessage || err?.message || 'Failed to save property entry. Please check your connection.';
      const fullDetails = JSON.stringify({
        code,
        message,
        details: err?.details || null,
        stack: err?.stack || null,
        raw: String(err),
        timestamp: new Date().toISOString()
      }, null, 2);

      setSaveError({ code, message, fullDetails });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLocalSaving(false);
    }
  };

  const handleConfirmDuplicateSave = async () => {
    if (pendingPayload) {
      setDuplicateModalOpen(false);
      setIsLocalSaving(true);
      try {
        await onSave(pendingPayload, pendingIsSaveAndNew);
        if (pendingIsSaveAndNew) {
          resetForm();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err: any) {
        console.error('Duplicate save confirmation error:', err);
        const code = err?.code || 'save-error';
        const message = err?.originalMessage || err?.message || 'Failed to save property entry.';
        const fullDetails = JSON.stringify({
          code,
          message,
          details: err?.details || null,
          stack: err?.stack || null,
          timestamp: new Date().toISOString()
        }, null, 2);
        setSaveError({ code, message, fullDetails });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setIsLocalSaving(false);
      }
    }
  };

  const isUnderConstruction = propertyType === 'Under-Construction Project';

  return (
    <div className="font-sans min-h-[100dvh] bg-[var(--paper)]">
      {/* Discard Changes Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowDiscardDialog(false)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl animate-in slide-in-from-bottom">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Discard changes?</h3>
            <p className="text-sm text-gray-600 mb-6">You have unsaved changes. Are you sure you want to discard them?</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowDiscardDialog(false)} className="w-full py-3 rounded-xl bg-gray-100 font-semibold text-gray-800 cursor-pointer">Keep editing</button>
              <button onClick={onCancel} className="w-full py-3 rounded-xl bg-rose-50 font-bold text-rose-700 cursor-pointer">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky App Bar */}
      <div className="sticky top-0 z-40 h-[56px] bg-[var(--surface)] border-b border-[var(--rule)] flex items-center px-3 gap-3 justify-between">
         <button onClick={() => isDirty ? setShowDiscardDialog(true) : onCancel()} className="w-[44px] h-[44px] flex items-center justify-center cursor-pointer">
            <ArrowLeft className="w-6 h-6 text-[var(--ink)]" />
         </button>
         <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[var(--ink)] truncate">{initialFlat ? 'Edit entry' : 'New entry'}</h2>
            {(Number(flatSize) > 0 && (Number(askingPrice) > 0 || Number(ratePerSqFt) > 0)) && (
                <div className="text-[12px] text-[var(--ink-2)] truncate tabular-nums">
                    {Number(askingPrice) > 0 ? `৳ ${formatBangladeshiCompact(Number(askingPrice)).replace('৳ ','')}` : ''}
                    {Number(askingPrice) > 0 && Number(ratePerSqFt) > 0 ? ' · ' : ''}
                    {Number(ratePerSqFt) > 0 ? `৳${Number(ratePerSqFt).toLocaleString()}/sq ft` : ''}
                </div>
            )}
         </div>
         {/* Save Buttons */}
         <div className="flex items-center gap-2">
            <button
               onClick={(e) => handleSaveButtonClick(e, false)}
               className="h-[40px] px-6 rounded-xl bg-[var(--pine)] text-white font-bold text-[14px] cursor-pointer"
            >
               {isSavingState ? 'Saving...' : 'Save'}
            </button>
            {!initialFlat && (
                <button
                   onClick={(e) => handleSaveButtonClick(e, true)}
                   className="h-[40px] px-6 rounded-xl border border-[var(--rule)] text-[var(--ink)] font-bold text-[14px] cursor-pointer"
                >
                   Save & New
                </button>
            )}
         </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 max-w-[720px] mx-auto">
         {/* Price Ticket Inline Summary */}
         <div className="mb-4 bg-white rounded-xl border border-[var(--rule)] p-3">
             <div onClick={() => setIsPriceTicketOpen(!isPriceTicketOpen)} className="flex items-center justify-between cursor-pointer">
                 <span className="font-bold text-[var(--ink)]">Price breakdown</span>
                 {isPriceTicketOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
             </div>
             {isPriceTicketOpen && (
                 <div className="mt-4 pt-4 border-t border-[var(--rule)] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block mb-0.5">
                          TOTAL ESTIMATED PRICE
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight">
                          {displayGrandTotal ? formatBangladeshiCompact(displayGrandTotal) : '—'}
                        </div>
                        <div className="text-xs text-gray-600 font-mono mt-0.5">
                          {displayGrandTotal ? `Full Amount: ৳ ${formatBangladeshiCurrency(displayGrandTotal)}` : 'Enter flat size & price to calculate total'}
                        </div>
                      </div>

                      {/* Breakdown Grid */}
                      <div className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--rule)] shadow-2xs space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Size & Rate:</span>
                          <span className="font-mono font-semibold text-gray-900">
                            {numFlatSize > 0 ? `${formatBangladeshiCurrency(numFlatSize)} sq ft` : '— sq ft'}
                            {' × '}
                            {resolvedRate ? `৳${formatBangladeshiCurrency(resolvedRate)}` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Base Flat Price:</span>
                          <span className="font-mono font-bold text-gray-900">
                            {resolvedBasePrice ? `৳${formatBangladeshiCurrency(resolvedBasePrice)}` : '—'}
                          </span>
                        </div>
                        {(numUtility > 0 || numParking > 0 || numOther > 0) && (
                          <div className="flex justify-between items-center text-gray-500 pt-1 border-t border-gray-100">
                            <span>Extra Charges:</span>
                            <span className="font-mono text-gray-700">
                              + ৳{formatBangladeshiCurrency(numUtility + numParking + numOther)}
                            </span>
                          </div>
                        )}
                        {customGrandTotal && (
                          <div className="text-[10px] text-amber-700 font-semibold pt-1">
                            * Grand total includes custom user override
                          </div>
                        )}
                      </div>
                    </div>
                 </div>
             )}
         </div>


      {/* Main Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              {initialFlat ? 'Edit Property Record' : 'Quick Capture Property'}
            </h1>
            <p className="text-xs text-gray-500">
              Fast real-estate data capture. All fields optional · Auto-calculated pricing
            </p>
          </div>
        </div>
      </div>

      {/* Visible Firestore Error Banner with Copy Details */}
      {saveError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-red-900 break-words">
                Couldn't save: {saveError.code ? `${saveError.code} — ` : ''}{saveError.message}
              </h3>
              <p className="text-xs text-red-700 mt-1">
                Firestore was unable to save this property entry. Check your internet connection or copy the technical error details below.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(saveError.fullDetails);
                    setCopiedDetails(true);
                    setTimeout(() => setCopiedDetails(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 text-xs font-bold transition-colors cursor-pointer border border-red-200"
                >
                  {copiedDetails ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Copied details!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-red-700" />
                      <span>Copy details</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSaveError(null)}
                  className="text-xs text-red-700 hover:text-red-900 font-medium px-2 py-1 hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSaveError(null)}
              className="text-red-400 hover:text-red-700 p-1 cursor-pointer"
              title="Close error banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Validation Guard Error Banner */}
      {emptyFormError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="font-semibold">{emptyFormError}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSaveButtonClick(e, false)} noValidate className="space-y-4">
        {/* ================================================================= */}
        {/* LEVEL 1: QUICK CAPTURE (ALWAYS OPEN, COMPACT SINGLE SCREEN) */}
        {/* ================================================================= */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D35400]" />
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Level 1: Quick Capture</h2>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              Core 8 Fields
            </span>
          </div>

          {/* 1. Property Type (Segmented Pill Switcher) */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Property Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPropertyType('Ready Flat')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  propertyType === 'Ready Flat'
                    ? 'bg-white text-[#D35400] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Ready Flat</span>
              </button>
              <button
                type="button"
                onClick={() => setPropertyType('Under-Construction Project')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  propertyType === 'Under-Construction Project'
                    ? 'bg-white text-[#D35400] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <HardHat className="w-4 h-4" />
                <span>Under-Construction Project</span>
              </button>
            </div>
          </div>

          {/* 2. Building / Project Name & 3. Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                {isUnderConstruction ? 'Project Name' : 'Building / Apartment Name'}
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={isUnderConstruction ? 'e.g. Rangs Fortune, Shanta Pinnacle' : 'e.g. Navana Tower, Green Villa'}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] focus:border-transparent outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Location (Society/Area, Block, Road)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dhanmondi, Road 8/A, House 24"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Area (Neighborhood / Zone)
            </label>
            <input
              type="text"
              list="flat-areas-list"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Mohammadpur, Bashundhara R/A"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] focus:border-transparent outline-hidden"
            />
            <datalist id="flat-areas-list">
              {availableAreas.map((aName) => (
                <option key={aName} value={aName} />
              ))}
            </datalist>
          </div>

          {/* 4. Contact Name and Phone Number (Side-by-side in one row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Contact Name / Owner Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Mr. Rafiqul Islam / Marketing Rep"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] focus:border-transparent outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1 flex items-center justify-between">
                <span>Phone Number</span>
                {phoneNumber && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    digits: {normalizePhone(phoneNumber)}
                  </span>
                )}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 01711-XXXXXX"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] focus:border-transparent outline-hidden font-mono"
              />
            </div>
          </div>

          {/* 5. Flat Size & 6. Bedrooms & Bathrooms Steppers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Flat Size (sq ft)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={flatSize}
                  onChange={(e) => handleFlatSizeChange(e.target.value)}
                  placeholder="e.g. 1450"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] focus:border-transparent outline-hidden font-mono pr-14"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 font-medium pointer-events-none">
                  sq ft
                </span>
              </div>
            </div>

            {/* Steppers side-by-side even on small screens */}
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <StepperInput
                label="Bedrooms"
                value={bedrooms}
                onChange={setBedrooms}
                placeholder="0"
              />
              <StepperInput
                label="Bathrooms"
                value={bathrooms}
                onChange={setBathrooms}
                placeholder="0"
              />
            </div>
          </div>

          {/* 7. Price: Single Input with Toggle "Total | per sq ft" */}
          <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#D35400]" />
                <span>Price</span>
              </label>
              {/* Segmented Toggle: Total vs per sq ft */}
              <div className="inline-flex rounded-lg p-0.5 bg-orange-200/50 text-xs">
                <button
                  type="button"
                  onClick={() => setPriceMode('total')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    priceMode === 'total'
                      ? 'bg-white text-[#D35400] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Total Price (BDT)
                </button>
                <button
                  type="button"
                  onClick={() => setPriceMode('rate')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    priceMode === 'rate'
                      ? 'bg-white text-[#D35400] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Rate / sq ft (BDT)
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={priceMode === 'total' ? askingPrice : ratePerSqFt}
                onChange={(e) => handleQuickPriceChange(e.target.value)}
                placeholder={priceMode === 'total' ? 'e.g. 18500000' : 'e.g. 12500'}
                className="w-full px-3 py-2.5 text-base font-bold text-gray-900 border border-orange-200 rounded-lg focus:ring-2 focus:ring-[#D35400] focus:border-transparent outline-hidden font-mono bg-white"
              />
            </div>

            {/* Price Preview & Calculated Helpers */}
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 pt-1">
              {priceMode === 'total' ? (
                <>
                  <div className="font-mono">
                    {numAskingPrice > 0 ? (
                      <span className="font-bold text-gray-900">
                        ৳{formatBangladeshiCurrency(numAskingPrice)}{' '}
                        <span className="text-emerald-700 font-semibold">
                          ({formatBangladeshiCroreLakh(numAskingPrice)})
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">Enter total asking price</span>
                    )}
                  </div>
                  {numAskingPrice > 0 && numFlatSize > 0 && (
                    <div className="text-[#D35400] font-semibold font-mono">
                      ≈ ৳{formatBangladeshiCurrency(Math.round(numAskingPrice / numFlatSize))} / sq ft
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-mono">
                    {numRate > 0 ? (
                      <span className="font-bold text-gray-900">
                        ৳{formatBangladeshiCurrency(numRate)} / sq ft
                      </span>
                    ) : (
                      <span className="text-gray-400">Enter price per square foot</span>
                    )}
                  </div>
                  {numRate > 0 && numFlatSize > 0 && (
                    <div className="text-[#D35400] font-semibold font-mono">
                      Total: ৳{formatBangladeshiCurrency(Math.round(numRate * numFlatSize))}{' '}
                      <span className="text-emerald-700 font-semibold">
                        ({formatBangladeshiCroreLakh(Math.round(numRate * numFlatSize))})
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* LEVEL 2: PROGRESSIVE DISCLOSURE (FOLDED COLLAPSIBLE CARDS) */}
        {/* ================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Level 2: Detailed Real Estate Specifications (Folded)
            </h3>
            <span className="text-[11px] text-gray-400">Tap cards to expand</span>
          </div>

          {/* CARD 1: Building, Floor & Facilities */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('building')}
              className="w-full px-4 py-3 bg-[#FAF9F6] hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#D35400]" />
                <span className="text-sm font-bold text-gray-900">
                  Card 1: Floor, Structure & Building Amenities
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  buildingFilledCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {buildingFilledCount > 0 ? `${buildingFilledCount} filled` : 'Empty'}
                </span>
              </div>
              {expandedSections.building ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.building && (
              <div className="p-4 sm:p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Floor No.</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={floorNo}
                      onChange={(e) => setFloorNo(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Total Floors</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Building Structure</label>
                    <input
                      type="text"
                      value={buildingStructure}
                      onChange={(e) => setBuildingStructure(e.target.value)}
                      placeholder="e.g. G+9, B+G+14"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Floors Available</label>
                    <input
                      type="text"
                      value={floorsAvailable}
                      onChange={(e) => setFloorsAvailable(e.target.value)}
                      placeholder="e.g. 3rd, 5th, 7th"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                </div>

                {isUnderConstruction && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Total Flats in Project</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={totalFlatsInProject}
                        onChange={(e) => setTotalFlatsInProject(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 40"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Unsold Flats Count</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={unsoldFlatsCount}
                        onChange={(e) => setUnsoldFlatsCount(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 12"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Facing Directions (Multi-select) */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Facing Directions (Multi-Select)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_FACING_DIRECTIONS.map((dir) => {
                      const selected = facingDirections.includes(dir);
                      return (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => toggleFacingDirection(dir)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            selected
                              ? 'bg-[#D35400] text-white border-[#D35400] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {dir}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Flat Position</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Corner', 'Middle', 'Side-Edge', 'Not Sure'] as FlatPositionType[]).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setFlatPosition(flatPosition === pos ? '' : pos)}
                          className={`py-1.5 px-1 text-center rounded text-xs font-semibold border transition-all ${
                            flatPosition === pos
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Facing Notes</label>
                    <input
                      type="text"
                      value={facingNotes}
                      onChange={(e) => setFacingNotes(e.target.value)}
                      placeholder="e.g. Road facing, open south corner"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                </div>

                {/* Building Amenities (Tri-State Yes / No / ?) */}
                <div>
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
                    Building Amenities (3-State: Yes / No / ?)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <TriStateToggle
                      label="Lift / Elevator"
                      value={liftAvailable}
                      onChange={setLiftAvailable}
                    />
                    <TriStateToggle
                      label="Generator Backup"
                      value={generatorAvailable}
                      onChange={setGeneratorAvailable}
                    />
                    <TriStateToggle
                      label="Car Parking"
                      value={parkingAvailable}
                      onChange={setParkingAvailable}
                    />
                    <TriStateToggle
                      label="Intercom"
                      value={intercomAvailable}
                      onChange={setIntercomAvailable}
                    />
                    <TriStateToggle
                      label="24/7 Security / CCTV"
                      value={security24x7}
                      onChange={setSecurity24x7}
                    />
                    <TriStateToggle
                      label="Fire Exit"
                      value={fireExitAvailable}
                      onChange={setFireExitAvailable}
                    />
                    <TriStateToggle
                      label="Community Hall"
                      value={communityHallAvailable}
                      onChange={setCommunityHallAvailable}
                    />
                    <TriStateToggle
                      label="Solar Power"
                      value={solarAvailable}
                      onChange={setSolarAvailable}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: Interior & Layout Details */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('interior')}
              className="w-full px-4 py-3 bg-[#FAF9F6] hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#D35400]" />
                <span className="text-sm font-bold text-gray-900">
                  Card 2: Balconies, Rooms & Interior Layout
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  interiorFilledCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {interiorFilledCount > 0 ? `${interiorFilledCount} filled` : 'Empty'}
                </span>
              </div>
              {expandedSections.interior ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.interior && (
              <div className="p-4 sm:p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StepperInput
                    label="Balconies / Verandas"
                    value={balconies}
                    onChange={setBalconies}
                  />
                  <StepperInput
                    label="Drawing Rooms"
                    value={drawingRooms}
                    onChange={setDrawingRooms}
                  />
                  <StepperInput
                    label="Dining Rooms"
                    value={diningRooms}
                    onChange={setDiningRooms}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                    Drawing & Dining Arrangement
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Separate', 'Combined', ''] as (DrawingDiningArrangement | '')[]).map((arr) => {
                      const label = arr === '' ? 'Not Specified' : arr;
                      const selected = drawingDiningArrangement === arr;
                      return (
                        <button
                          key={arr || 'none'}
                          type="button"
                          onClick={() => setDrawingDiningArrangement(arr)}
                          className={`py-2 px-2 text-center rounded-lg text-xs font-bold border transition-all ${
                            selected
                              ? 'bg-[#D35400] text-white border-[#D35400] shadow-xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Layout & Interior Description
                  </label>
                  <textarea
                    rows={2}
                    value={layoutDescription}
                    onChange={(e) => setLayoutDescription(e.target.value)}
                    placeholder="e.g. Spacious living hall, master bed with attached bath and veranda..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: Pricing & Payment Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('pricing')}
              className="w-full px-4 py-3 bg-[#FAF9F6] hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-[#D35400]" />
                <span className="text-sm font-bold text-gray-900">
                  Card 3: Pricing Breakdown & Payment Terms
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pricingFilledCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {pricingFilledCount > 0 ? `${pricingFilledCount} filled` : 'Empty'}
                </span>
              </div>
              {expandedSections.pricing ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.pricing && (
              <div className="p-4 sm:p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Utility Charges (BDT)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={utilityCharges}
                      onChange={(e) => setUtilityCharges(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Car Parking Charges (BDT)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={parkingCharges}
                      onChange={(e) => setParkingCharges(e.target.value)}
                      placeholder="e.g. 500000"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Other Charges (BDT)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      placeholder="e.g. 100000"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Grand Total Override (BDT)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={customGrandTotal}
                      onChange={(e) => setCustomGrandTotal(e.target.value)}
                      placeholder={computedGrandTotal ? `Auto: ${computedGrandTotal}` : 'e.g. 19500000'}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                    />
                  </div>
                  {/* Tri-state Negotiable (No highlight by default) */}
                  <div>
                    <TriStateToggle
                      label="Price Negotiable"
                      value={negotiable}
                      onChange={setNegotiable}
                      subtitle="Unknown by default"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Mode / Terms</label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. Installment, Full Cash, 30% Down"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Booking / Down Payment (BDT)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      placeholder="e.g. 2000000"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Handover / Ready Date</label>
                    <input
                      type="text"
                      value={handoverDate}
                      onChange={(e) => setHandoverDate(e.target.value)}
                      placeholder="e.g. Dec 2026 or Ready to Move"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: Utilities & Documentation / Legal */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('legal')}
              className="w-full px-4 py-3 bg-[#FAF9F6] hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D35400]" />
                <span className="text-sm font-bold text-gray-900">
                  Card 4: Utilities, Legal & Paperwork
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  legalFilledCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {legalFilledCount > 0 ? `${legalFilledCount} filled` : 'Empty'}
                </span>
              </div>
              {expandedSections.legal ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.legal && (
              <div className="p-4 sm:p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Gas Supply</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Titas Gas', 'LPG Cylinder', 'None', 'Not Sure'] as GasLineType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setGasLine(gasLine === type ? '' : type)}
                          className={`py-1.5 px-2 text-xs font-semibold rounded border text-center transition-all ${
                            gasLine === type
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tri-state Separate Electric Meter (No highlight by default) */}
                  <div>
                    <TriStateToggle
                      label="Separate Electric Meter"
                      value={separateElectricMeter}
                      onChange={setSeparateElectricMeter}
                      subtitle="Unknown by default"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Water Supply</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['WASA', 'Deep Tube-well', 'Both', 'Not Sure'] as WaterSupplyType[]).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWaterSupply(waterSupply === w ? '' : w)}
                          className={`py-1.5 px-2 text-xs font-semibold rounded border text-center transition-all ${
                            waterSupply === w
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Bank Loan Eligibility</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Yes', 'No', 'Unknown'] as BankLoanType[]).map((bl) => (
                        <button
                          key={bl}
                          type="button"
                          onClick={() => setBankLoanPossible(bankLoanPossible === bl ? '' : bl)}
                          className={`py-1.5 px-2 text-xs font-semibold rounded border text-center transition-all ${
                            bankLoanPossible === bl
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {bl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">RAJUK / CDA Approval</label>
                    <select
                      value={rajukApproval}
                      onChange={(e) => setRajukApproval(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden bg-white"
                    >
                      <option value="">Select approval status</option>
                      <option value="Approved">Approved</option>
                      <option value="In Process">In Process</option>
                      <option value="Not Approved">Not Approved</option>
                      <option value="Not Sure">Not Sure</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Registration Status</label>
                    <select
                      value={registrationStatus}
                      onChange={(e) => setRegistrationStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden bg-white"
                    >
                      <option value="">Select registration status</option>
                      <option value="Complete">Complete</option>
                      <option value="In Process">In Process</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Registered">Not Registered</option>
                      <option value="Not Sure">Not Sure</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Mutation / Namjari</label>
                    <select
                      value={mutationStatus}
                      onChange={(e) => setMutationStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden bg-white"
                    >
                      <option value="">Select mutation status</option>
                      <option value="Complete">Complete</option>
                      <option value="In Process">In Process</option>
                      <option value="Pending">Pending</option>
                      <option value="Not Done">Not Done</option>
                      <option value="Not Sure">Not Sure</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Legal / Paperwork Notes</label>
                  <textarea
                    rows={2}
                    value={documentationNotes}
                    onChange={(e) => setDocumentationNotes(e.target.value)}
                    placeholder="e.g. Land deed clear, CS/SA/RS khatian verified..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CARD 5: Contact, Follow-up & Dates */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('contact')}
              className="w-full px-4 py-3 bg-[#FAF9F6] hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#D35400]" />
                <span className="text-sm font-bold text-gray-900">
                  Card 5: Contact Tracking, Plot & Follow-ups
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  contactFilledCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {contactFilledCount > 0 ? `${contactFilledCount} filled` : 'Empty'}
                </span>
              </div>
              {expandedSections.contact ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.contact && (
              <div className="p-4 sm:p-5 space-y-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {isUnderConstruction && (
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Developer / Company Name</label>
                      <input
                        type="text"
                        value={developerName}
                        onChange={(e) => setDeveloperName(e.target.value)}
                        placeholder="e.g. Shanta Holdings"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Plot / House No.</label>
                    <input
                      type="text"
                      value={plotHouseNo}
                      onChange={(e) => setPlotHouseNo(e.target.value)}
                      placeholder="e.g. Plot 42, Road 11"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Contact Status</label>
                    <select
                      value={contactStatus}
                      onChange={(e) => setContactStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden bg-white"
                    >
                      <option value="Not Contacted Yet">Not Contacted Yet</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Follow-up Needed">Follow-up Needed</option>
                      <option value="Visited">Visited</option>
                      <option value="Negotiating">Negotiating</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Date Recorded</label>
                    <input
                      type="date"
                      value={dateRecorded}
                      onChange={(e) => setDateRecorded(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Date Contacted (Optional)</label>
                    <input
                      type="date"
                      value={dateContacted}
                      onChange={(e) => setDateContacted(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Next Follow-up Date</label>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Follow-up Notes</label>
                  <textarea
                    rows={2}
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g. Called owner on Monday, requested brochure via WhatsApp..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CARD 6: Listing Status, Media & Notes */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSection('listing')}
              className="w-full px-4 py-3 bg-[#FAF9F6] hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#D35400]" />
                <span className="text-sm font-bold text-gray-900">
                  Card 6: Listing Status & Media Links
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  listingFilledCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {listingFilledCount > 0 ? `${listingFilledCount} filled` : 'Empty'}
                </span>
              </div>
              {expandedSections.listing ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.listing && (
              <div className="p-4 sm:p-5 space-y-4 border-t border-gray-100">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Listing Status</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['Available', 'Sold', 'Rented', 'On Hold', 'Not Interested'] as ListingStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setListingStatus(st)}
                        className={`py-2 px-2 text-center rounded-lg text-xs font-bold border transition-all ${
                          listingStatus === st
                            ? 'bg-[#D35400] text-white border-[#D35400] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Media / Drive Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mediaLink}
                      onChange={(e) => setMediaLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                    />
                    {mediaLink && (
                      <a
                        href={mediaLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center text-xs font-semibold"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Additional Notes</label>
                  <textarea
                    rows={2}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="General property remarks..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35400] outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Save & Cancel Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            <button
              id="bottom-save-and-new-btn"
              type="button"
              onClick={(e) => handleSaveButtonClick(e, true)}
              disabled={isSavingState}
              className="relative z-10 pointer-events-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="Save current property and open fresh empty form"
            >
              <Plus className="w-4 h-4" />
              <span>{isSavingState ? 'Saving…' : 'Save & New'}</span>
            </button>
            <button
              id="bottom-save-property-btn"
              type="button"
              onClick={(e) => handleSaveButtonClick(e, false)}
              disabled={isSavingState}
              className="relative z-10 pointer-events-auto px-6 py-2.5 bg-[#D35400] hover:bg-[#B94600] active:scale-95 text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingState ? 'Saving…' : initialFlat ? 'Update Property' : 'Save Property'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Duplicate Phone Check Modal */}
      {duplicateMatchedFlat && (
        <DuplicateWarningModal
          isOpen={duplicateModalOpen}
          phoneNumber={phoneNumber}
          existingFlat={duplicateMatchedFlat}
          onSaveAnyway={handleConfirmDuplicateSave}
          onOpenExisting={(flat) => {
            setDuplicateModalOpen(false);
            if (onOpenExisting) {
              onOpenExisting(flat);
            }
          }}
          onCancel={() => {
            setDuplicateModalOpen(false);
            setIsLocalSaving(false);
          }}
        />
      )}
      </div>
    </div>
  );
};
