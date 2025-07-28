'use client';

import { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Home, 
  Building, 
  Star,
  Check,
  X,
  Phone,
  User,
  Navigation,
  Globe,
  Shield,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks';
import { Address } from '@/types';
import { cn } from '@/lib/utils';

export function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      _id: '1',
      name: 'Bran Don',
      phone: '0700123456',
      addressLine1: '123 Main Street',
      addressLine2: 'Apartment 4B',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00100',
      country: 'Kenya',
      type: 'home',
      isDefault: true,
    },
    {
      _id: '2',
      name: 'Bran Don',
      phone: '0700123456',
      addressLine1: '456 Corporate Plaza',
      addressLine2: 'Floor 12, Suite 1200',
      city: 'Nairobi',
      state: 'Nairobi',
      postalCode: '00200',
      country: 'Kenya',
      type: 'work',
      isDefault: false,
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState<Partial<Address>>({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kenya',
    type: 'home',
    isDefault: false,
  });

  const kenyanCounties = [
    'Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Machakos', 'Kajiado',
    'Kisumu', 'Uasin Gishu', 'Meru', 'Kilifi', 'Kwale', 'Laikipia',
    'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Bungoma', 'Kakamega'
  ];

  const addressTypes = [
    { 
      value: 'home', 
      label: 'Home', 
      icon: Home, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    { 
      value: 'work', 
      label: 'Work', 
      icon: Building, 
      color: 'from-purple-500 to-violet-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: MapPin, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      if (editingAddress) {
        setAddresses(prev => prev.map(addr => 
          addr._id === editingAddress._id ? { ...formData, _id: editingAddress._id } as Address : addr
        ));
        success('Address updated successfully!');
      } else {
        const newAddress: Address = {
          ...formData,
          _id: Date.now().toString(),
        } as Address;
        setAddresses(prev => [...prev, newAddress]);
        success('Address added successfully!');
      }
      
      resetForm();
    } catch (err) {
      error('Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setIsDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    setDeletingId(addressId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAddresses(prev => prev.filter(addr => addr._id !== addressId));
    setDeletingId(null);
    success('Address deleted successfully!');
  };

  const setAsDefault = async (addressId: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr._id === addressId
    })));
    success('Default address updated!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Kenya',
      type: 'home',
      isDefault: false,
    });
    setEditingAddress(null);
    setIsDialogOpen(false);
  };

  const getAddressTypeConfig = (type: string) => {
    return addressTypes.find(t => t.value === type) || addressTypes[0];
  };

  const copyAddress = (address: Address) => {
    const addressText = `${address.name}\n${address.phone}\n${address.addressLine1}\n${address.addressLine2 ? address.addressLine2 + '\n' : ''}${address.city}, ${address.state} ${address.postalCode}\n${address.country}`;
    navigator.clipboard.writeText(addressText);
    success('Address copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Saved Addresses
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your delivery locations
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => resetForm()}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              Add Address
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <DialogHeader className="pb-6">
              <DialogTitle className="flex items-center space-x-3 text-xl">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  {editingAddress ? <Edit className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
                </div>
                <span>{editingAddress ? 'Edit Address' : 'Add New Address'}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Personal Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                      className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="0700 123 456"
                        className="pl-10 h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

              {/* Address Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Address Details</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Street Address</Label>
                    <Input
                      value={formData.addressLine1}
                      onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                      placeholder="Street address, P.O. Box, etc."
                      className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Additional Info (Optional)</Label>
                    <Input
                      value={formData.addressLine2}
                      onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                      placeholder="Apartment, suite, floor, etc."
                      className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">City</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">County</Label>
                      <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl">
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
                          {kenyanCounties.map((county) => (
                            <SelectItem key={county} value={county} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl mx-2 my-1">
                              {county}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Postal Code</Label>
                      <Input
                        value={formData.postalCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="00100"
                        className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Address Type</Label>
                      <Select value={formData.type} onValueChange={(value: 'home' | 'work' | 'other') => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
                          {addressTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl mx-2 my-1">
                              <div className="flex items-center space-x-3">
                                <div className={`h-6 w-6 bg-gradient-to-br ${type.color} rounded-lg flex items-center justify-center`}>
                                  <type.icon className="h-3 w-3 text-white" />
                                </div>
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="h-12 px-6 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    editingAddress ? (
                      <Edit className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    )
                  )}
                  {isLoading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Add Address')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Address Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {addresses.map((address, index) => {
          const typeConfig = getAddressTypeConfig(address.type);
          const isDeleting = deletingId === address._id;
          
          return (
            <Card 
              key={address._id} 
              className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                address.isDefault 
                  ? "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" 
                  : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50",
                isDeleting && "opacity-50 scale-95"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.5s ease-out forwards'
              }}
            >
              {/* Default indicator */}
              {address.isDefault && (
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[50px] border-l-transparent border-t-[50px] border-t-blue-500">
                  <Star className="absolute -top-10 -right-4 h-4 w-4 text-white fill-current" />
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-12 w-12 bg-gradient-to-br ${typeConfig.color} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <typeConfig.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                        {address.type} Address
                      </CardTitle>
                      {address.isDefault && (
                        <Badge variant="default" className="mt-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-300 group/btn" 
                      onClick={() => copyAddress(address)}
                    >
                      <Copy className="h-4 w-4 text-blue-600 group-hover/btn:scale-110 transition-transform duration-300" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-all duration-300 group/btn" 
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4 text-green-600 group-hover/btn:scale-110 transition-transform duration-300" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300 group/btn" 
                      onClick={() => handleDelete(address._id!)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600 group-hover/btn:scale-110 transition-transform duration-300" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{address.name}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400">{address.phone}</p>
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                {/* Address details */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-slate-900 dark:text-slate-100 font-medium">{address.addressLine1}</p>
                      {address.addressLine2 && (
                        <p className="text-slate-600 dark:text-slate-400">{address.addressLine2}</p>
                      )}
                      <p className="text-slate-600 dark:text-slate-400">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">{address.country}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Set as default button */}
                {!address.isDefault && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full h-10 border-2 border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition-all duration-300 group/default"
                      onClick={() => setAsDefault(address._id!)}
                    >
                      <Star className="h-4 w-4 mr-2 group-hover/default:scale-110 group-hover/default:fill-current transition-all duration-300" />
                      Set as Default
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {addresses.length === 0 && (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-16 w-16 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No addresses saved yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Add your first address to get started with deliveries
          </p>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Address
          </Button>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}