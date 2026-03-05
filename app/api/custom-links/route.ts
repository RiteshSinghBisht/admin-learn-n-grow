import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS headers for local development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase server setup is incomplete. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('custom_links')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      const response = NextResponse.json(
        { error: 'Failed to fetch custom links', details: error.message },
        { status: 500, headers: corsHeaders }
      );
      return response;
    }

    const response = NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data,
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('Error fetching custom links:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch custom links', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
    return response;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();
    const { title, url, icon, display_order } = body;

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, url' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('custom_links')
      .insert([
        {
          title: String(title).trim(),
          url: String(url).trim(),
          icon: icon || 'Link',
          display_order: display_order || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create custom link', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Custom link created successfully',
      data: data,
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('Error creating custom link:', error);
    return NextResponse.json(
      { error: 'Failed to create custom link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();
    const { id, title, url, icon, display_order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build update object
    const updateData: { title?: string; url?: string; icon?: string; display_order?: number } = {};
    if (title !== undefined) updateData.title = title.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from('custom_links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update custom link', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Custom link updated successfully',
      data: data,
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('Error updating custom link:', error);
    return NextResponse.json(
      { error: 'Failed to update custom link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing custom link ID' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { error } = await supabase
      .from('custom_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete custom link', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Custom link deleted successfully',
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('Error deleting custom link:', error);
    return NextResponse.json(
      { error: 'Failed to delete custom link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
