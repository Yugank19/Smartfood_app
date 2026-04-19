package com.myanatomy.sandboxpro.dto;

import com.myanatomy.sandboxpro.model.PickupRequest;
import lombok.Data;

@Data
public class UpdateStatusRequest {
    private PickupRequest.Status status;
}
