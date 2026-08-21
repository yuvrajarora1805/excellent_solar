'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Camera, MapPin, Upload, X, Loader2, Navigation } from 'lucide-react';
import ProjectInventorySelector, { type ReservationItem } from '@/components/ui/ProjectInventorySelector';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Site photo + geotag state
  const [sitePhoto, setSitePhoto] = useState<File | null>(null);
  const [sitePhotoPreview, setSitePhotoPreview] = useState<string | null>(null);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const [reservations, setReservations] = useState<ReservationItem[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    district: '',
    state: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ─── GEOLOCATION ────────────────────────────────────────────────
  const captureGeoLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLocation({
          lat: parseFloat(position.coords.latitude.toFixed(7)),
          lng: parseFloat(position.coords.longitude.toFixed(7)),
        });
        setGeoLoading(false);
      },
      () => {
        setGeoError('Unable to get location. Please allow location access.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ─── PHOTO HANDLER ──────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSitePhoto(file);
    setSitePhotoPreview(URL.createObjectURL(file));
    captureGeoLocation();
  };

  const removeSitePhoto = () => {
    setSitePhoto(null);
    setSitePhotoPreview(null);
    setGeoLocation(null);
    setGeoError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile.replace(/\s/g, ''))) {
      newErrors.mobile = 'Invalid mobile number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
      if (sitePhoto) payload.append('sitePhoto', sitePhoto);
      if (geoLocation) {
        payload.append('siteLat', String(geoLocation.lat));
        payload.append('siteLng', String(geoLocation.lng));
      }
      if (reservations.length > 0) {
        payload.append('reservations', JSON.stringify(reservations.map(r => ({ product_id: r.product_id, quantity: r.quantity }))));
      }

      const response = await fetch('/api/customers', { method: 'POST', body: payload });

      if (response.ok) {
        const customer = await response.json();
        router.push(`/customers/${customer.id}`);
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to create customer' });
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      setErrors({ form: 'Failed to create customer. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Customer</h1>
          <p className="text-slate-600 dark:text-slate-400">Add a new customer to the system</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Enter the customer's personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.form && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                {errors.form}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={errors.mobile ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.mobile && <p className="text-sm text-red-600 mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="customer@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Full address"
                  className={errors.address ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className={errors.city ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="District"
                    className={errors.district ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.district && <p className="text-sm text-red-600 mt-1">{errors.district}</p>}
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className={errors.state ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Site Photo + Geotag Card ── */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Camera className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Site Photo</CardTitle>
                <CardDescription>
                  Upload a photo of the customer&apos;s installation site. GPS coordinates are captured automatically.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              id="sitePhoto"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {/* Upload Area */}
            {!sitePhotoPreview && (
              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <Camera className="w-8 h-8 text-slate-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700 dark:text-slate-300">Click to capture or upload site photo</p>
                  <p className="text-sm text-slate-500 mt-1">JPG, PNG, WEBP supported &bull; GPS tagged automatically</p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full">
                    <Camera className="w-3 h-3" /> Camera
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-full">
                    <Upload className="w-3 h-3" /> File Upload
                  </span>
                </div>
              </div>
            )}

            {/* Photo Preview */}
            {sitePhotoPreview && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={sitePhotoPreview} alt="Site photo preview" className="w-full h-56 object-cover" />
                <button
                  type="button"
                  onClick={removeSitePhoto}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs font-medium truncate">{sitePhoto?.name}</p>
                </div>
              </div>
            )}

            {/* Geolocation Section */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">GPS Coordinates</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={captureGeoLocation}
                  disabled={geoLoading}
                  className="text-xs"
                >
                  {geoLoading ? (
                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Locating&hellip;</>
                  ) : (
                    <><Navigation className="w-3 h-3 mr-1.5" /> {geoLocation ? 'Refresh' : 'Get Location'}</>
                  )}
                </Button>
              </div>
              <div className="px-4 py-3">
                {geoError && <p className="text-sm text-red-600 dark:text-red-400">{geoError}</p>}
                {!geoLocation && !geoLoading && !geoError && (
                  <p className="text-sm text-slate-500">Click &quot;Get Location&quot; or select a photo — GPS will be captured automatically.</p>
                )}
                {geoLoading && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Acquiring GPS signal&hellip;
                  </p>
                )}
                {geoLocation && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Latitude</p>
                        <p className="font-mono font-semibold text-green-700 dark:text-green-400">{geoLocation.lat}&deg;</p>
                      </div>
                      <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Longitude</p>
                        <p className="font-mono font-semibold text-green-700 dark:text-green-400">{geoLocation.lng}&deg;</p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${geoLocation.lat},${geoLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline font-medium"
                    >
                      <MapPin className="w-3 h-3" />
                      View on Google Maps &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Reservation */}
        <Card>
          <CardHeader>
            <CardTitle>Initial Project Inventory</CardTitle>
            <CardDescription>Reserve solar panels or inverters right away (automatically creates a project for this customer)</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectInventorySelector value={reservations} onChange={setReservations} />
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-4">
          <Link href="/customers">
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving&hellip;</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {reservations.length > 0 ? 'Create Customer + Project' : 'Create Customer'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
