'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Home, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks';
import { Address } from '@/types';

export function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      _id: '1',
      name: 'John Doe',
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
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
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
    'Kisumu', 'Uasin Gishu', 'Meru', 'Kilifi', 'Kwale', 'Laikipia'
  ];

  const handleSave = () => {
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
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setIsDialogOpen(true);
  };

  const handleDelete = (addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr._id !== addressId));
    success('Address deleted successfully!');
  };

  const setAsDefault = (addressId: string) => {
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

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'work': return <Building className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Saved Addresses</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0700 123 456"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input
                  value={formData.addressLine1}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-2">
                <Label>Address Line 2 (Optional)</Label>
                <Input
                  value={formData.addressLine2}
                  onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>County</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {kenyanCounties.map((county) => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="00100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'home' | 'work' | 'other') => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSave}>
                  {editingAddress ? 'Update' : 'Add'} Address
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <Card key={address._id} className={address.isDefault ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getAddressIcon(address.type)}
                  <CardTitle className="text-sm font-medium capitalize">
                    {address.type} Address
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {address.isDefault && (
                    <Badge variant="default" className="text-xs">Default</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(address)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(address._id!)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{address.name}</p>
              <p className="text-sm text-muted-foreground">{address.phone}</p>
              <p className="text-sm">{address.addressLine1}</p>
              {address.addressLine2 && (
                <p className="text-sm">{address.addressLine2}</p>
              )}
              <p className="text-sm">
                {address.city}, {address.state} {address.postalCode}
              </p>
              {!address.isDefault && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setAsDefault(address._id!)}
                >
                  Set as Default
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}