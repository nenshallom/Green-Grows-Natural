'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  original_price?: number | null; // <--- NEW: Added to interface
  unit: string;
  stock_quantity: number;
  image_url: string | null;
  additional_images: string[];
  is_bulk_buy_enabled: boolean;
  bulk_buy_price: number | null;
  bulk_threshold: number | null;
  is_group_buy_enabled: boolean;
  group_buy_price: number | null;
  group_threshold: number | null;
  current_group_buyers: number;
  group_buy_deadline: string | null;
}

// This interface is used to merge order and order item data for campaign participants
interface Participant {
  order_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  quantity: number;
  payment_status: string;
  date_joined: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedCampaign, setSelectedCampaign] = useState<Product | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // --- BASIC FORM STATE ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState(''); // <--- NEW: State for original price
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  
  const [newMainImageFile, setNewMainImageFile] = useState<File | null>(null);
  const [newAdditionalFiles, setNewAdditionalFiles] = useState<File[]>([]);
  const [tempMainImageUrl, setTempMainImageUrl] = useState<string | null>(null);
  const [tempAdditionalUrls, setTempAdditionalUrls] = useState<string[]>([]);

  // PRICING STATES
  const [isBulk, setIsBulk] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkThreshold, setBulkThreshold] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [groupPrice, setGroupPrice] = useState('');
  const [groupThreshold, setGroupThreshold] = useState('');
  const [groupDeadline, setGroupDeadline] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleViewParticipants = async (product: Product) => {
    setSelectedCampaign(product);
    setLoadingParticipants(true);
    try {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity')
        .eq('product_id', product.id)
        .eq('purchase_type', 'group');
        
      if (itemsError) throw itemsError;
      if (!orderItems || orderItems.length === 0) {
        setParticipants([]);
        return;
      }

      const orderIds = orderItems.map(item => item.order_id);

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, first_name, last_name, email, contact_phone, payment_status, created_at')
        .in('id', orderIds);
        
      if (ordersError) throw ordersError;

      const mergedData: Participant[] = orderItems.map(item => {
        const orderInfo = orders?.find(o => o.id === item.order_id);
        return {
          order_id: item.order_id,
          first_name: orderInfo?.first_name || 'Unknown',
          last_name: orderInfo?.last_name || '',
          email: orderInfo?.email || 'N/A',
          phone: orderInfo?.contact_phone || 'N/A',
          quantity: item.quantity,
          payment_status: orderInfo?.payment_status || 'pending',
          date_joined: orderInfo?.created_at || new Date().toISOString()
        };
      });

      setParticipants(mergedData.sort((a, b) => new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime()));
    } catch (error: any) {
      console.error("Error fetching participants:", error.message);
      alert("Failed to load participants.");
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description || '');
    setCategory(product.category);
    setPrice(product.price_per_unit.toString());
    setOriginalPrice(product.original_price?.toString() || ''); // <--- NEW: Load existing original price
    setUnit(product.unit || 'kg');
    setStock(product.stock_quantity.toString());
    setTempMainImageUrl(product.image_url);
    setTempAdditionalUrls(product.additional_images || []);
    setNewMainImageFile(null);
    setNewAdditionalFiles([]);
    setIsBulk(product.is_bulk_buy_enabled);
    setBulkPrice(product.bulk_buy_price?.toString() || '');
    setBulkThreshold(product.bulk_threshold?.toString() || '');
    setIsGroup(product.is_group_buy_enabled);
    setGroupPrice(product.group_buy_price?.toString() || '');
    setGroupThreshold(product.group_threshold?.toString() || '');
    
    if (product.group_buy_deadline) {
      const dateObj = new Date(product.group_buy_deadline);
      const tzOffset = dateObj.getTimezoneOffset() * 60000; 
      const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
      setGroupDeadline(localISOTime);
    } else { setGroupDeadline(''); }

    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeExistingGalleryImage = (urlToRemove: string) => {
    setTempAdditionalUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      let finalMainImageUrl = tempMainImageUrl; 
      let finalAdditionalUrls = [...tempAdditionalUrls]; 
      
      if (newMainImageFile) {
        finalMainImageUrl = await handleImageUpload(newMainImageFile);
      }
      
      if (newAdditionalFiles.length > 0) {
        const uploadedNewUrls = await Promise.all(newAdditionalFiles.map(file => handleImageUpload(file)));
        finalAdditionalUrls = [...finalAdditionalUrls, ...uploadedNewUrls]; 
      }

      const productData = {
        name, description, category, unit,
        price_per_unit: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null, // <--- NEW: Save to database
        stock_quantity: Number(stock),
        image_url: finalMainImageUrl, 
        additional_images: finalAdditionalUrls,
        is_bulk_buy_enabled: isBulk,
        bulk_buy_price: isBulk && bulkPrice ? Number(bulkPrice) : null,
        bulk_threshold: isBulk && bulkThreshold ? Number(bulkThreshold) : null,
        is_group_buy_enabled: isGroup,
        group_buy_price: isGroup && groupPrice ? Number(groupPrice) : null,
        group_threshold: isGroup && groupThreshold ? Number(groupThreshold) : null,
        group_buy_deadline: isGroup && groupDeadline ? new Date(groupDeadline).toISOString() : null,
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
        alert('Product updated successfully!');
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        alert('Product created successfully!');
      }
      
      resetForm();
      fetchProducts();
    } catch (error: any) {
      alert(`Error saving product: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProduct = async (id: string, productName: string) => {
    if (!window.confirm(`Permanently delete ${productName}?`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (error: any) {
      alert(`Error deleting product: ${error.message}`);
    }
  };

  const resetForm = () => {
    setEditingId(null); setIsFormOpen(false);
    setName(''); setDescription(''); setCategory(''); setPrice(''); setOriginalPrice(''); setStock(''); 
    setUnit('kg');
    setNewMainImageFile(null); setNewAdditionalFiles([]); 
    setTempMainImageUrl(null); setTempAdditionalUrls([]);
    setIsBulk(false); setBulkPrice(''); setBulkThreshold('');
    setIsGroup(false); setGroupPrice(''); setGroupThreshold(''); setGroupDeadline('');
  };

  const InteractiveImagePreview = ({ url, onRemove, type }: {url:string; onRemove:()=>void; type: 'main'|'gallery'}) => (
    <div className="relative group w-20 h-20 border-2 border-gray-200 rounded-lg overflow-hidden shadow-inner bg-gray-100">
      <img src={url} alt="Preview" className="w-full h-full object-cover" />
      <button type="button" onClick={onRemove} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
          <p className="text-gray-600 mt-1">Granular control over inventory, images, and campaigns.</p>
        </div>
        <button 
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)} 
          className={`font-bold py-2 px-6 rounded-lg transition-colors shadow-sm ${isFormOpen ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {isFormOpen ? 'Close Form' : '+ Add New Product'}
        </button>
      </div>

      {/* --- CRUD FORM --- */}
      {isFormOpen && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 mb-8 border-t-4 border-t-green-500">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {editingId ? `Editing Product: ${name}` : 'Create New Product Listing'}
          </h2>
          <form onSubmit={handleSaveProduct} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" required value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input list="categories" required value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none text-black" />
                <datalist id="categories">
                  <option value="Tubers" /><option value="Grains" /><option value="Vegetables" /><option value="Livestock" /><option value="Fruits" />
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none text-black"></textarea>
            </div>

            {/* --- NEW: UPGRADED 3-COLUMN PRICING GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Price (₦)</label>
                <input type="number" required min={0} value={price} onChange={(e)=>setPrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
                <select required value={unit} onChange={(e)=>setUnit(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none text-black bg-white">
                  <option value="kg">Per kg</option>
                  <option value="bag">Per Bag</option>
                  <option value="pack">Per Pack</option>
                  <option value="bunch">Per Bunch</option>
                  <option value="crate">Per Crate</option>
                  <option value="unit">Per Unit/Item</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original Price (₦) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input type="number" min={0} value={originalPrice} onChange={(e)=>setOriginalPrice(e.target.value)} placeholder="Triggers Badge" className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none text-black bg-yellow-50/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input type="number" required min={0} value={stock} onChange={(e)=>setStock(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:border-green-500 outline-none text-black" />
              </div>
            </div>

            {/* Image Upload UI */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-6">
              <h3 className="font-bold text-gray-800 border-b pb-2">Image Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Main Product Image</label>
                  {tempMainImageUrl && (
                    <div className="mb-3 flex items-center gap-3 bg-white p-2 rounded-lg border">
                      <InteractiveImagePreview url={tempMainImageUrl} type="main" onRemove={() => setTempMainImageUrl(null)} />
                      <p className="text-xs text-gray-500">Current main image. Click X to replace.</p>
                    </div>
                  )}
                  <input type="file" required={!tempMainImageUrl} accept="image/*" onChange={(e)=>setNewMainImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images (Gallery)</label>
                  {tempAdditionalUrls.length > 0 && (
                    <div className="mb-3 bg-white p-3 rounded-lg border">
                      <div className="flex gap-2.5 overflow-x-auto pb-1">
                        {tempAdditionalUrls.map((url, idx) => (
                          <InteractiveImagePreview key={idx} url={url} type="gallery" onRemove={() => removeExistingGalleryImage(url)} />
                        ))}
                      </div>
                    </div>
                  )}
                  <input type="file" multiple accept="image/*" onChange={(e)=>setNewAdditionalFiles(Array.from(e.target.files || []))} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Bulk & Group Toggles */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={isBulk} onChange={(e)=>setIsBulk(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="font-bold text-blue-900">Enable Bulk Buying Discount</span>
              </label>
              {isBulk && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Bulk Discounted Price (₦)</label>
                    <input type="number" required={isBulk} min={0} value={bulkPrice} onChange={(e)=>setBulkPrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Min Order Qty</label>
                    <input type="number" required={isBulk} min={2} value={bulkThreshold} onChange={(e)=>setBulkThreshold(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none text-black" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={isGroup} onChange={(e)=>setIsGroup(e.target.checked)} className="w-4 h-4 text-green-600 rounded" />
                <span className="font-bold text-green-900">Enable Group Campaign</span>
              </label>
              {isGroup && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">Group Share Price (₦)</label>
                    <input type="number" required={isGroup} min={0} value={groupPrice} onChange={(e)=>setGroupPrice(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">Target Buyers Needed</label>
                    <input type="number" required={isGroup} min={2} value={groupThreshold} onChange={(e)=>setGroupThreshold(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">Campaign Deadline</label>
                    <input type="datetime-local" required={isGroup} value={groupDeadline} onChange={(e)=>setGroupDeadline(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none text-black" />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={processing} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-colors disabled:bg-gray-500 shadow-md">
              {processing ? 'Saving Changes...' : editingId ? 'Update Product' : 'Publish New Product'}
            </button>
          </form>
        </div>
      )}

      {/* --- UPGRADED PRODUCTS LISTING TABLE --- */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Loading secure inventory...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 border border-dashed border-gray-200 m-4 rounded-lg bg-gray-50">
             No products found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 font-medium w-16">Img</th>
                  <th className="p-4 font-medium">Product Details</th>
                  <th className="p-4 font-medium">Stock Status</th>
                  <th className="p-4 font-medium">Active Campaigns</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => {
                  const isGroupActive = product.is_group_buy_enabled;
                  const groupTarget = product.group_threshold || 1;
                  const groupCurrent = product.current_group_buyers || 0;
                  const isGroupComplete = isGroupActive && (groupCurrent >= groupTarget);
                  const progressPercentage = isGroupActive ? Math.min(100, (groupCurrent / groupTarget) * 100) : 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 relative">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-[10px] border border-gray-200">No Img</div>
                        )}
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 leading-tight">{product.name}</p>
                          {/* Admin table badge showing if it's on sale */}
                          {product.original_price && product.original_price > product.price_per_unit && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 rounded">SALE</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">₦{product.price_per_unit.toLocaleString()} | {product.category}</p>
                      </td>
                      
                      <td className="p-4 text-sm whitespace-nowrap">
                        {product.stock_quantity > 0 ? (
                          <span className="font-medium text-gray-900">{product.stock_quantity.toLocaleString()} units left</span>
                        ) : (
                          <span className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded-full text-xs">OUT OF STOCK</span>
                        )}
                      </td>
                      
                      <td className="p-4 min-w-[200px]">
                        <div className="flex flex-col gap-2 items-start w-full">
                          {product.is_bulk_buy_enabled && (
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100">
                              Bulk Min: {product.bulk_threshold?.toLocaleString()}
                            </span>
                          )}
                          
                          {isGroupActive && (
                            <div className="w-full bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-700">Group Buy</span>
                                {isGroupComplete ? (
                                  <span className="text-[10px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded uppercase">Completed</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-500">{groupCurrent}/{groupTarget} Joined</span>
                                )}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div className={`h-1.5 rounded-full ${isGroupComplete ? 'bg-green-500' : 'bg-gray-800'}`} style={{ width: `${progressPercentage}%` }}></div>
                              </div>
                              
                              {groupCurrent > 0 && (
                                <button 
                                  onClick={() => handleViewParticipants(product)}
                                  className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 py-1 rounded transition-colors"
                                >
                                  View Participants
                                </button>
                              )}
                            </div>
                          )}
                          {!product.is_bulk_buy_enabled && !product.is_group_buy_enabled && <span className="text-gray-400 text-xs font-medium">Standard Only</span>}
                        </div>
                      </td>

                      <td className="p-4 text-right space-x-3 whitespace-nowrap pr-6">
                        <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors">Edit</button>
                        <button onClick={() => handleDeleteProduct(product.id, product.name)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- CAMPAIGN PARTICIPANTS MODAL --- */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
              <div>
                <p className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Campaign CRM</p>
                <h2 className="text-2xl font-black text-gray-900">{selectedCampaign.name}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Target: {selectedCampaign.group_threshold} | Current: {selectedCampaign.current_group_buyers} 
                  {selectedCampaign.current_group_buyers >= (selectedCampaign.group_threshold || 1) && <span className="text-green-600 font-bold ml-2">✅ Target Reached!</span>}
                </p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-0 overflow-y-auto bg-white flex-1">
              {loadingParticipants ? (
                 <div className="p-12 text-center text-gray-500 animate-pulse font-medium">Hunting down participants...</div>
              ) : participants.length === 0 ? (
                 <div className="p-12 text-center text-gray-500">No one has joined this campaign yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="p-4 font-medium text-gray-500">Date Joined</th>
                      <th className="p-4 font-medium text-gray-500">Customer Name</th>
                      <th className="p-4 font-medium text-gray-500">Contact Info</th>
                      <th className="p-4 font-medium text-gray-500 text-right">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {participants.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-600 font-medium">
                          {new Date(p.date_joined).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          {p.first_name} {p.last_name}
                        </td>
                        <td className="p-4">
                          <p className="text-blue-600 font-medium"><a href={`mailto:${p.email}`}>{p.email}</a></p>
                          <p className="text-gray-500 text-xs mt-0.5">{p.phone}</p>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${p.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {p.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
               <button onClick={() => alert("Emailing all participants logic will go here!")} className="bg-gray-900 text-white font-bold py-2 px-6 rounded-lg hover:bg-black transition-colors">
                  Contact All Participants
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}